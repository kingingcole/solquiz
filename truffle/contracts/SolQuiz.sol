// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract SolQuiz {
    using SafeMath for uint256;

    uint256 constant public CORRECT_OPTION_POINTS_AWARDED = 5;
    uint256 constant public RATE_QUIZ_POINT_COST = 2;

    struct Quiz {
        uint id;
        string question;
        string[] options;
        uint256 correctOption;
        uint256 totalRatings;
        uint256 positiveRatings;
        uint256 numberOfResponses;
        address creator;
        mapping(address => bool) quizRatings;
        mapping(address => bool) userResponses;
    }

    struct User {
        uint256 points;
        string displayName;
    }

    struct QuizResponseObject {
        uint id;
        string question;
        string[] options;
        uint256 correctOption;
        uint256 totalRatings;
        uint256 positiveRatings;
        uint256 numberOfResponses;
        address creator;
        bool userHasAnswered;
        bool userHasRated;
    }

    Quiz[] public quizzes;

    mapping(address => User) public leaderboard; // mapping of address to User
    address[] public leaderboardKeys;

    event QuizCreated(uint256 indexed quizId, string question, address creator);
    event BatchQuizzesCreated(uint256 indexed batchCreateId, uint numberOfQuizzes, address creator);
    event BatchQuizzesAnswered(uint256 indexed batchCreateId, uint numberOfQuizzes, address answerer);
    event QuizRated(address rater, uint256 quizId, bool positiveRating);
    event QuizAnswered(address participant, uint256 quizId, uint256 option, bool isCorrect);
    event PointsAwarded(address participant, uint256 points);
    event LeaderboardUpdated(address[] addresses, uint256[] points);

    address public manager; // Manager of the smart contract
    uint256 private nonce;

    constructor() {
        manager = msg.sender;
    }

    function generateRandomId() internal view  returns (uint256) {
        return uint256(blockhash(block.number - 1));
    }

    modifier hasAccount() {
        require(bytes(leaderboard[msg.sender].displayName).length > 0, "User account does not exist");
        _;
    }

    modifier onlyManager() {
        require(msg.sender == manager, "Only the manager can call this function");
        _;
    }

    modifier isNotManager() {
        require(msg.sender != manager, "The manager cannot call this function");
        _;
    }

    function createQuiz(string memory _question, string[] memory _options, uint256 _correctOption, bool isBatchCreate) hasAccount public {
        require(_options.length >= 2, "Minimum two options required");
        require(_correctOption < _options.length, "Invalid correct option");

        uint quizId = quizzes.length;

        Quiz storage newQuiz = quizzes.push();

        newQuiz.id = quizId;
        newQuiz.question = _question;
        newQuiz.options = _options;
        newQuiz.correctOption = _correctOption;
        newQuiz.totalRatings = 0;
        newQuiz.positiveRatings = 0;
        newQuiz.numberOfResponses = 0;
        newQuiz.creator = msg.sender;


        if (!isBatchCreate) {
            emit QuizCreated(quizId, _question, msg.sender);
        }
    }

    function getQuiz(uint256 _quizId) hasAccount public view returns (QuizResponseObject memory) {
        require(_quizId < quizzes.length, "Invalid quiz ID");

        Quiz storage quiz = quizzes[_quizId];

        return QuizResponseObject({
            id: quiz.id,
            question: quiz.question,
            options: quiz.options,
            correctOption: quiz.correctOption,
            totalRatings: quiz.totalRatings,
            positiveRatings: quiz.positiveRatings,
            numberOfResponses: quiz.numberOfResponses,
            creator: quiz.creator,
            userHasAnswered: quiz.userResponses[msg.sender],
            userHasRated: quiz.quizRatings[msg.sender]
        });
    }

    function batchCreateQuiz(
        string[] memory _questions,
        string[][] memory _options,
        uint256[] memory _correctOptions
    ) public hasAccount {
        require(_questions.length == _options.length, "Array length mismatch");
        require(_questions.length <= 10, "Exceeded maximum batch quiz creations");

        for (uint256 i = 0; i < _questions.length; i++) {
            string memory question = _questions[i];
            string[] memory options = _options[i];
            uint256 correctOption = _correctOptions[i];

            createQuiz(question, options, correctOption, true);

            emit BatchQuizzesCreated(generateRandomId(), _questions.length, msg.sender);
        }
    }

    function rateQuiz(uint256 _quizId, bool _positiveRating) public hasAccount {
        require(_quizId < quizzes.length, "Invalid quiz ID");
        require(leaderboard[msg.sender].points > RATE_QUIZ_POINT_COST, "Insufficient points to rate quiz");

        Quiz storage quiz = quizzes[_quizId];

        require(quiz.quizRatings[msg.sender] == false, "Quiz already rated");

        quiz.totalRatings++;
        if (_positiveRating) {
            quiz.positiveRatings++;
        }
        quiz.quizRatings[msg.sender] = true;
        leaderboard[msg.sender].points = leaderboard[msg.sender].points.sub(RATE_QUIZ_POINT_COST);
        emit QuizRated(msg.sender, _quizId, _positiveRating);
    }

    function createUser(string memory displayName) public {
        require(bytes(leaderboard[msg.sender].displayName).length < 1, "User aleady exists blah blah");
        require(bytes(displayName).length > 0, "Invalid display name");

        User memory newUser = User({
            displayName: displayName,
            points: 0
        });
        leaderboard[msg.sender] = newUser;
        leaderboardKeys.push(msg.sender);
    }

    function editUser(string memory displayName) public {
        require(bytes(leaderboard[msg.sender].displayName).length > 0, "User does not exist blah blah");
        require(bytes(displayName).length > 0, "Invalid display name");

        leaderboard[msg.sender].displayName = displayName;
    }

    function answerQuiz(uint256 _quizId, uint256 _option) isNotManager hasAccount public returns (bool, uint) {
        require(_quizId < quizzes.length, "Invalid quiz ID");
        
        Quiz storage quiz = quizzes[_quizId];

        require(_option < quiz.options.length, "Invalid option");
        require(quiz.creator != msg.sender, "You cannot answer your own question!");
        require(quiz.userResponses[msg.sender] == false, "Quiz already answered");

        quiz.userResponses[msg.sender] = true;

        // Check if the answer is correct
        bool isCorrect = quiz.correctOption == _option;

        // Award points to the participant if the answer is correct
        if (isCorrect) {
            awardPoints(msg.sender, CORRECT_OPTION_POINTS_AWARDED);
        }

        emit QuizAnswered(msg.sender, _quizId, _option, isCorrect);

        return (isCorrect, CORRECT_OPTION_POINTS_AWARDED);
    }

    function batchAnswerQuiz(uint256[] memory _quizIds, uint256[] memory _options) isNotManager hasAccount public returns (uint points) {
        require(_quizIds.length == _options.length, "Array length mismatch");
        points = 0;

        for (uint256 i = 0; i < _quizIds.length; i++) {
            uint256 quizId = _quizIds[i];
            uint256 option = _options[i];
            require(quizId < quizzes.length, "Invalid quiz ID");

            Quiz storage quiz = quizzes[quizId];

            require(option < quiz.options.length, "Invalid option");
            if (quiz.userResponses[msg.sender] == true) {
                // "Quiz already answered"
                continue;
            }

            quiz.userResponses[msg.sender] = true;

            // Award points to the participant if the answer is correct
            if (quizzes[quizId].correctOption == option) {
                points += CORRECT_OPTION_POINTS_AWARDED;
            }
        }  
        
        if (points > 0) {
            awardPoints(msg.sender, points);
        }

        emit BatchQuizzesAnswered(generateRandomId(), _quizIds.length, msg.sender);
    }

    function awardPoints(address user, uint256 points) public {
        leaderboard[user].points = leaderboard[user].points.add(points);
        emit PointsAwarded(user, points);
    }

    function isQuizValid(uint256 _quizId) public view returns (bool) {
        require(_quizId < quizzes.length, "Invalid quiz ID");

        Quiz storage quiz = quizzes[_quizId];
        if (quiz.totalRatings < 5) {
            return true;
        }
        uint256 positiveRatio = (quiz.positiveRatings * 100) / quiz.totalRatings;
        return positiveRatio >= 50;
    }

    function getQuizCount() public view returns (uint256) {
        return quizzes.length;
    }

    function getUserHasAnsweredQuiz(uint256 _quizId, address _participant) public view returns (bool) {
        require(_quizId < quizzes.length, "Invalid quiz ID");

        return quizzes[_quizId].userResponses[_participant];
    }

    function getQuizRatings(uint256 _quizId) public view returns (uint256, uint256) {
        require(_quizId < quizzes.length, "Invalid quiz ID");

        Quiz storage quiz = quizzes[_quizId];
        return (quiz.totalRatings, quiz.positiveRatings);
    }

    function getLeaderboard() public view returns (address[] memory, string[] memory, uint256[] memory) {
        uint256 leaderboardSize = leaderboardKeys.length;
        address[] memory addresses = new address[](leaderboardSize);
        string[] memory displayNames = new string[](leaderboardSize);
        uint256[] memory points = new uint256[](leaderboardSize);

        for (uint256 i = 0; i < leaderboardSize; i++) {
            addresses[i] = leaderboardKeys[i];
            displayNames[i] = leaderboard[leaderboardKeys[i]].displayName;
            points[i] = leaderboard[leaderboardKeys[i]].points;
        }

        return (addresses, displayNames, points);
    }

    function getQuizzes(bool validQuizzes) public view returns (QuizResponseObject[] memory quizData) {
        quizData = new QuizResponseObject[](quizzes.length);

        for (uint256 i = 0; i < quizzes.length; i++) {
            Quiz storage quiz = quizzes[i];
            if (validQuizzes && !isQuizValid(quiz.id)) {
                continue;
            }
            
            quizData[i] = QuizResponseObject({
                id: quiz.id,
                question: quiz.question,
                options: quiz.options,
                correctOption: quiz.correctOption,
                totalRatings: quiz.totalRatings,
                positiveRatings: quiz.positiveRatings,
                numberOfResponses: quiz.numberOfResponses,
                creator: quiz.creator,
                userHasAnswered: quiz.userResponses[msg.sender],
                userHasRated: quiz.quizRatings[msg.sender]
            });
        }
    }

}
