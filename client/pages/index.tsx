import CheckIcon from '@mui/icons-material/Check';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import { Box, Button, FormControl, FormControlLabel, IconButton, Modal, Radio, RadioGroup, Stack, Switch, TextField } from "@mui/material";
import CustomButton from "components/Button";
import { useEth } from 'eth.context';
import { NewQuiz, QuizResponseObject, User } from "models";
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from "react";
import { RATE_QUIZ_POINT_COST, getTruncatedAddress } from 'styles/utils';

const defaultNewQuiz: NewQuiz = {
  question: "",
  options: ["", ""],
  correctOption: null,
}

interface HomeProps {
  user: User | null;
  setUser: (user: User) => null;
}

export default function Home({ user, setUser }: HomeProps): JSX.Element {
  const eth = useEth();

  const [quizzes, setQuizzes] = useState<QuizResponseObject[]>([]);
  const [randomQuiz, setRandomQuiz] = useState<QuizResponseObject | null>(null);

  const [isBatchAnswer, setIsBatchAnswer] = useState(true);

  const [batchQuizIds, setBatchQuizIds] = useState<number[]>([]);
  const [batchQuizOptions, setBatchQuizOptions] = useState<number[]>([]);

  const [openModal, setOpenModal] = useState(false);
  const [newQuiz, setNewQuiz] = useState<NewQuiz>(defaultNewQuiz);
  const [loading, setLoading] = useState(false);
  const [sendingAnswer, setSendingAnswer] = useState(false);

  const [singleQuizValue, setSingleQuizValue] = useState<string | null>(null);

  const resetQuiz = () => {
    setNewQuiz(defaultNewQuiz)
  }

  const handleCloseModal = () => setOpenModal(false);

  const addOption = () => setNewQuiz({ ...newQuiz, options: [...newQuiz.options, ""] });

  const removeOption = (index: number) => {
    const options = [...newQuiz.options];
    options.splice(index, 1);
    setNewQuiz({ ...newQuiz, options });
  }

  const markAsCorrect = (index: number) => {
    if (newQuiz.correctOption === index) {
      return setNewQuiz({ ...newQuiz, correctOption: null })
    }
    setNewQuiz({ ...newQuiz, correctOption: index })
  };

  const addQuizButtonEnabled = () => {
    return newQuiz.question && newQuiz.options.length >= 2 && newQuiz.options.every(option => option) && newQuiz.correctOption !== null;
  }

  const saveQuiz = async () => {
    if (!eth.ready || !eth.account || !user?.displayName) return;

    setLoading(true);
    try {
      await eth.contracts.solQuiz.methods.createQuiz(newQuiz.question, newQuiz.options, newQuiz.correctOption, false).send({ from: eth.account });
    } catch (error) {
      console.error(error);
    } finally {
      resetQuiz();
      handleCloseModal();
      setLoading(false);
    }
  }

  const fetchQuizzes = useCallback(async () => {
    if (!eth.ready || !eth.account) return;
    setLoading(true);
    reset();
    
    try {
      const quizzes = await eth.contracts.solQuiz.methods
        .getQuizzes(true)
        .call({ from: eth.account });
      const eligibleQuizzes = quizzes.filter((q: QuizResponseObject) => !q.userHasAnswered);
      setQuizzes(eligibleQuizzes);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, [eth, setQuizzes]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes, eth]);

  const getRandomQuiz = useCallback(() => {
    return quizzes[Math.floor(Math.random() * quizzes.length)];
  }, [quizzes]);

  useEffect(() => {
    if (quizzes.length) {
      setRandomQuiz(getRandomQuiz());
    }
  }, [quizzes, getRandomQuiz])

  const handleSkipClicked = () => {
    setSingleQuizValue(null);
    setRandomQuiz(getRandomQuiz());
  }

  const handleSubmitSingleAnswer = async () => {
    if (!eth.ready || !randomQuiz) return;
    setSendingAnswer(true);
    try {
      const tx = await eth.contracts.solQuiz.methods.answerQuiz(randomQuiz.id, singleQuizValue).send({ from: eth.account });
      const pointsAwarded = parseInt(tx.events?.PointsAwarded?.returnValues[1])
      pointsAwarded && setUser({ ...user, points: Number(user?.points) + pointsAwarded })
      fetchQuizzes();
    } catch (e) {
      console.warn(e);
    }
    setSendingAnswer(false);
  }

  const addToBatchAnswer = () => {
    if (!randomQuiz) return;
    setBatchQuizIds([...batchQuizIds, randomQuiz.id]);
    setBatchQuizOptions([...batchQuizOptions, Number(singleQuizValue)]);
    setRandomQuiz(getRandomQuiz());
    setSingleQuizValue(null);
  }

  const handleBatchSubmitAnswer = async () => {
    if (!eth.ready) return;
    setSendingAnswer(true);
    try {
      console.log({batchQuizIds, batchQuizOptions})
      const tx = await eth.contracts.solQuiz.methods.batchAnswerQuiz(batchQuizIds, batchQuizOptions).send({ from: eth.account });
      const pointsAwarded = parseInt(tx.events?.PointsAwarded?.returnValues[1])
      pointsAwarded && setUser({ ...user, points: Number(user?.points) + pointsAwarded })
      fetchQuizzes();
    } catch (e) {
      console.warn(e);
    }
    setSendingAnswer(false);
    setBatchQuizIds([]);
    setBatchQuizOptions([]);  
  }

  const reset = () => {
    setRandomQuiz(null);
    setSingleQuizValue(null);
  }

  const displayQuizSection = () => {
    if (eth.ready && !user?.displayName) {
      return <p style={{ fontSize: '15px' }}>Create a profile to participate.</p>
    }

    if (!eth.ready || (eth.ready && !eth.account)) {
      return <p style={{ fontSize: '15px' }}>Connect your wallet to participate.</p>
    }

    if (loading) {
      return <p style={{ fontSize: '15px' }}>Fetching eligible quizzes...</p>
    }

    if(!randomQuiz) {
      return <p style={{ fontSize: '15px' }}>There are no eligible quizzes for this user account.</p>
    }

    const ratingDisabled = randomQuiz.userHasRated || eth.web3.utils.toChecksumAddress(randomQuiz.creator) === eth.account || user?.points < RATE_QUIZ_POINT_COST;

    const rateQuiz = async (rating: boolean) => {
      if (!eth.ready || !randomQuiz) return;
      const confirmRating = async () => {
        try {
          await eth.contracts.solQuiz.methods.rateQuiz(randomQuiz.id, rating).send({ from: eth.account });
          setRandomQuiz({ ...randomQuiz, userHasRated: true, positiveRatings: rating ? Number(randomQuiz.positiveRatings) + 1 : randomQuiz.positiveRatings, totalRatings: randomQuiz.totalRatings + 1 });
          setUser({ ...user, points: Number(user?.points) - RATE_QUIZ_POINT_COST })
        } catch (e) {
          console.warn(e);
        }
      }

      if (confirm('This action costs 2 points. Are you sure you want to proceed?')) {
        confirmRating();
      }
    }

    const cannotAnswer = randomQuiz.userHasAnswered || eth.web3.utils.toChecksumAddress(randomQuiz.creator) === eth.account || eth.account === eth.manager;
    const getCannotAnswerReason = () => {
      if (randomQuiz.userHasAnswered) {
        return 'You have already answered this quiz.';
      }
      if (eth.web3.utils.toChecksumAddress(randomQuiz.creator) === eth.account) {
        return 'You cannot answer your own quiz.';
      }
      if (eth.account === eth.manager) {
        return 'You cannot answer quizzes as the manager account.';
      }

      return ''
    }

    const getCannotRateReason = () => {
      if (randomQuiz.userHasRated) {
        return 'You have already rated this quiz.';
      }
      if (eth.web3.utils.toChecksumAddress(randomQuiz.creator) === eth.account) {
        return 'You cannot rate your own quiz.';
      }
      if (user?.points && user.points < RATE_QUIZ_POINT_COST) {
        return `You need at least ${RATE_QUIZ_POINT_COST} points to rate a quiz.`;
      }

      return ''
    }

    return (
      <>
        <FormControlLabel sx={{my: 3}} control={
          <Switch
          checked={isBatchAnswer}
          onChange={(e) => setIsBatchAnswer(e.target.checked)}
          inputProps={{ 'aria-label': 'controlled' }}
        />
        } label='Batch response mode' />
        {randomQuiz && (
          <Box sx={styles.singleQuizContainer}>
            <h3 style={styles.quizTitle} dangerouslySetInnerHTML={{__html: randomQuiz.question}}/>
            <FormControl>
              <RadioGroup
                aria-labelledby="demo-controlled-radio-buttons-group"
                name="controlled-radio-buttons-group"
                value={singleQuizValue}
                onChange={(e) => setSingleQuizValue(e.target.value)}
              >
                {
                  randomQuiz.options.map((option, index) => {
                    return <FormControlLabel key={index} value={index} control={<Radio disabled={getCannotAnswerReason().length > 0} />} label={option} />
                  })
                }
              </RadioGroup>
            </FormControl>
            <Stack sx={{ my: 2 }} direction={'row'} spacing={1} alignContent={'center'}>
              <CustomButton onClick={handleSkipClicked} disabled={quizzes.length < 2 || sendingAnswer} size='small' variant='outlined'>Skip</CustomButton>
              <CustomButton size='small' disabled={singleQuizValue === null || sendingAnswer || getCannotAnswerReason().length} onClick={!isBatchAnswer ? handleSubmitSingleAnswer : addToBatchAnswer}>Submit</CustomButton><span style={{alignSelf: 'center'}}>{getCannotAnswerReason()}</span>
            </Stack>
            <small style={{color: 'grey'}}>Created by {eth.account === randomQuiz.creator ? 'You' : getTruncatedAddress(randomQuiz.creator)}</small>
            <Stack sx={{ mt: 2 }} direction={'row'} alignItems={'center'}>
              {/* rating section */}
              <IconButton disabled={ratingDisabled} sx={{'&:hover': {color: 'green'}}} onClick={() => rateQuiz(true)}>
                <ThumbUpIcon fontSize='small'/> <small style={{ fontSize: '13px', marginLeft: '4px'}}>{randomQuiz.positiveRatings || 0}</small>
              </IconButton>
              <IconButton disabled={ratingDisabled} sx={{'&:hover': {color: 'red'}}} onClick={() => rateQuiz(false)}>
                <ThumbDownIcon fontSize='small'/> <small style={{ fontSize: '13px', marginLeft: '4px'}}>{randomQuiz.totalRatings - randomQuiz.positiveRatings || 0}</small>
              </IconButton>
              <small>{getCannotRateReason()}</small>
            </Stack>
          </Box>
        )}
        {isBatchAnswer && (
          <Box sx={{ mt: 2 }}>
            <CustomButton disabled={!batchQuizOptions.length} onClick={handleBatchSubmitAnswer}>Submit answers</CustomButton>
          </Box>
        )}
      </>
    )
  }

  const router = useRouter();

  return (
    <Box>
      <Stack direction={'row'} spacing={1} alignItems={'center'}>
        <CustomButton disabled={!eth.ready || !eth.account || !user?.displayName} onClick={() => setOpenModal(true)}>Create Single Quiz</CustomButton>
        <CustomButton disabled={!eth.ready || !eth.account || !user?.displayName} onClick={() => router.push('/create-bulk')}>Create Bulk Quiz</CustomButton>
        {eth.ready && eth.account && !user?.displayName && <small>No user profile. Kindly create one by clicking on your address on the navigation bar.</small>}
        {eth.ready && !eth.account && <small>Connect your wallet to create a quiz.</small>}
      </Stack>

      {displayQuizSection()}

      {/* create quiz modal */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 800,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            color: 'black'
          }}
        >
          <p id="simple-modal-title">Create Quiz</p>
          <TextField rows={2} multiline onChange={e => setNewQuiz({ ...newQuiz, question: e.target.value })} value={newQuiz.question} fullWidth variant='standard' sx={{ mb: 2 }} label='Question' />
          {newQuiz.options.map((option, index) => {
            const isCorrect = index === newQuiz.correctOption;
            return (
              <Stack spacing={1} direction={'row'} key={index} alignItems={'center'}>
                <TextField
                  onChange={e => {
                    const options = [...newQuiz.options];
                    options[index] = e.target.value;
                    setNewQuiz({ ...newQuiz, options });
                  }}
                  value={option} variant='standard' sx={{ mb: 2 }} label={`Option ${index + 1}`}
                />
                <Button sx={{ textTransform: 'capitalize' }} onClick={() => markAsCorrect(index)}>{!isCorrect ? 'Mark as Correct' : 'Unmark as Correct'}</Button>
                <Button disabled={newQuiz.options.length <= 2 || isCorrect} sx={{ textTransform: 'none', color: 'red' }} onClick={() => removeOption(index)}>Remove Option</Button>
                <CheckIcon sx={{ color: isCorrect ? 'green' : 'transparent' }} />
              </Stack>
            )
          })}
          <Button sx={{ display: 'block' }} onClick={addOption}>Add Option</Button>
          <CustomButton sx={{ mt: 3 }} disabled={loading || !addQuizButtonEnabled()} onClick={saveQuiz}>Save</CustomButton>
        </Box>
      </Modal>
    </Box>
  );
}

const styles = {
  singleQuizContainer: {
    borderRadius: '5px',
    border: '1px solid lightgrey',
    py: 3,
    px: 2,
  },
  quizTitle: {
    color: 'black',
    fontWeight: '500',
    margin: 0
  }
}
