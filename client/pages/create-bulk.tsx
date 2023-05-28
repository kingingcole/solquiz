import { Alert, Box, InputLabel, MenuItem, Select, SelectChangeEvent, Snackbar, Stack, TextField } from "@mui/material";
import CustomButton from "components/Button";
import { useEth } from "eth.context";
import { useState } from "react";
import { SUPPORTED_BULK_QUIZ_PROVIDERS } from "styles/utils";

const CreateBuilkQuiz = () => {
    const eth = useEth();
    const [selectedProvider, setSelectedProvider] = useState<any>(null);

    const [count, setCount] = useState('');
    const [category, setCategory] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [generating, setIsGenerating] = useState(false);

    const [alertState, setAlertState] = useState<any>({
        open: false,
        message: '',
        severity: 'success'
    })
    const handleCloseAlert = () => {
        setAlertState({
            open: false,
        })
    }

    const disableBtn = !selectedProvider || !Number(count) || !category || !difficulty || generating;

    function createChoices(incorrectAnswers: string[], correctAnswer: string) {
        const randomIndex = Math.floor(Math.random() * (incorrectAnswers.length + 1));
        const choices = [...incorrectAnswers.slice(0, randomIndex), correctAnswer, ...incorrectAnswers.slice(randomIndex)];
        return choices;
    }

    const reset = () => {
        setCount('');
        setCategory('');
        setDifficulty('');
        setIsGenerating(false);
    }

    const generateBulkQuiz = async () => {
        if (!eth.ready) return;
        
        setIsGenerating(true);
        if (selectedProvider.name === 'Opentdb') {
            try {
                const url = `${selectedProvider.baseUrl}?amount=${count}&type=multiple`;
                if (category !== 'any') {
                    url.concat(`&category=${category}`);
                }
                if (difficulty !== 'any') {
                    url.concat(`&difficulty=${difficulty.toLowerCase()}`);
                }
                const response = await fetch(url);
                const data = await response.json();
                if (data.response_code === 0) {
                    const questions: string[] = [], 
                        options: string[][] = [],
                        correctAnswers: number[] = [];
                    data.results.forEach((result: any) => {
                        questions.push(result.question);
                        const choices = createChoices(result.incorrect_answers, result.correct_answer);
                        options.push(choices);
                        correctAnswers.push(choices.indexOf(result.correct_answer));
                    });
                    await eth.contracts.solQuiz.methods.batchCreateQuiz(questions, options, correctAnswers).send({from: eth.account});
                    reset();
                    setAlertState({
                        open: true,
                        message: 'Bulk quiz generated successfully',
                        severity: 'success'
                    })
                } else {
                    console.error('Error generating bulk quiz', data);
                    setAlertState({
                        open: true,
                        message: 'Error generating bulk quiz',
                        severity: 'error'
                    })
                }
            } catch(error) {
                console.error(error);
                setAlertState({
                    open: true,
                    message: 'Error generating bulk quiz',
                    severity: 'error'
                })
            }

            return;
        }
        setIsGenerating(false);
    }

    return (
        <Box  sx={{ margin: '50px auto', maxWidth: '800px' }}>
            <p>Select a provider below to continue creating bulk quizzes.</p>
            <Stack spacing={1} direction={'row'} justifyContent={'space-between'}>
                {SUPPORTED_BULK_QUIZ_PROVIDERS.map((provider, index) => {
                    const isSelected = provider.name === selectedProvider?.name;
                    return (
                        <Box key={index} onClick={() => {
                            if (!provider.enabled) return;
                            setSelectedProvider(provider);
                            setCategory('');
                        }} sx={[styles.providerContainer, isSelected && styles.selectedproviderContainer, !provider.enabled && styles.providerContainerDisabled]}>
                            <p style={{ alignSelf: 'center', textAlign: 'center'}}>{provider.name} {!provider.enabled && <small>(Disabled)</small>}</p>
                            <small style={{ alignSelf: 'center', textAlign: 'center'}}>{provider.description}</small>
                        </Box>
                    )
                })}
                
            </Stack>
            {
                selectedProvider && (
                    <Box sx={{mt: 3}}>
                        <TextField sx={{ py: 1}} required value={count} onChange={(e) => setCount(e.target.value)} inputProps={{max: 10}} error={parseInt(count) > 10 || parseInt(count) < 1} helperText='Maximum count is 10' variant='standard' type="number" label="Number of quizzes to generate" fullWidth/>
                        <Box sx={{my:3}}>
                            <InputLabel id="category-label">Category</InputLabel>
                            <Select value={category} required labelId="category-label" variant="standard" fullWidth onChange={
                                (e: SelectChangeEvent) => setCategory(e.target.value)
                            }>
                                {selectedProvider.categories.map((category: Record<string, string>, index: number) => {
                                    return (
                                        <MenuItem key={index} value={category.id}>{category.name}</MenuItem>
                                    )
                                })}
                            </Select>
                        </Box>
                        <Box sx={{my:3}}>
                            <InputLabel id="difficulty-label">Difficulty</InputLabel>
                            <Select value={difficulty} required labelId="difficulty-label" variant="standard" fullWidth onChange={
                                (e: SelectChangeEvent) => setDifficulty(e.target.value)
                            }>
                                {selectedProvider.difficulties.map((difficulty: string, index: number) => {
                                    return (
                                        <MenuItem key={index} value={difficulty}>{difficulty}</MenuItem>
                                    )
                                })}
                            </Select>
                        </Box>
                        <CustomButton onClick={generateBulkQuiz} disabled={disableBtn}>Create Bulk Quiz</CustomButton>
                    </Box>
                )
            }

            <Snackbar
                open={alertState.open}
                autoHideDuration={6000}
                onClose={handleCloseAlert}
            >
                <Alert onClose={handleCloseAlert} severity={alertState.severity} sx={{ width: '100%' }}>
                    {alertState.message}
                </Alert>
            </Snackbar>
        </Box>
    )
}

const styles = {
    providerContainer: {
        padding: '20px',
        // background: '#00baba',
        width: '100%',
        borderRadius: '3px',
        border: '1px solid #00baba',
        cursor: 'pointer',
        color: '#00baba',
        transition: 'background-color 0.3s',

        '&:hover': {
            background: '#00baba',
            color: 'white',
        }
    },
    selectedproviderContainer: {
        background: '#00baba',
        color: 'white',
    },
    providerContainerDisabled: {
        background: '#e0e0e0',
        color: '#bdbdbd',
        cursor: 'not-allowed',
        border: '1px solid #bdbdbd',
        '&:hover': {
            background: '#e0e0e0',
            color: '#bdbdbd',
        }
    }
}

export default CreateBuilkQuiz;