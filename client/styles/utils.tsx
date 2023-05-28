export const RATE_QUIZ_POINT_COST = 2;

export const SUPPORTED_BULK_QUIZ_PROVIDERS = [{
    name: 'Opentdb',
    enabled: true,
    description: 'Open Trivia Database. Popular categories include General Knowledge, Entertainment, Science & Nature, History, Sports, Geography, and more.',
    baseUrl: 'https://opentdb.com/api.php',
    difficulties: ['Any', 'Easy', 'Medium', 'Hard'],
    categories: [
        {
            name: 'Any',
            id: 'any'
        },
        {
            name: 'General Knowledge',
            id: 9
        },
        {
            name: 'Entertainment: Books',
            id: 10
        },
        {
            name: 'Entertainment: Film',
            id: 11
        },
        {
            name: 'Entertainment: Music',
            id: 12
        },
        {
            name: 'Entertainment: Games',
            id: 15
        },
        {
            name: 'Entertainment: Television',
            id: 14
        },
        {
            name: 'Entertainment: Board Games',
            id: 16
        },
        {
            name: 'Science & Nature',
            id: 17
        },
        {
            name: 'Science: Computers',
            id: 18
        },
        {
            name: 'Science: Mathematics',
            id: 19
        },
        {
            name: 'Mythology',
            id: 20
        },
        {
            name: 'Sports',
            id: 21
        },
        {
            name: 'Geography',
            id: 22
        },
        {
            name: 'History',
            id: 23
        },
        {
            name: 'Politics',
            id: 24
        },
        {
            name: 'Art',
            id: 25
        },
        {
            name: 'Celebrities',
            id: 26
        },
        {
            name: 'Animals',
            id: 27
        }
    ]
}, {
    name: 'QuizAPI',
    enabled: false, // This API is currently complicated to use
    description: 'QuizAPI is a service that provides access to thousands of questions from dozens of categories. Popular categories include Linux, Bash, SQL, Docker, and DevOps.',
    baseUrl: 'https://quizapi.io/api/v1/questions',
    apiKey: 'hUWdcyjXEIz3nqIhDKkaYsQ7gYhRskoYPbwvO0uA',
    difficulties: ['Any', 'Easy', 'Medium', 'Hard'],
    categories: [
        {
            name: 'Any',
            id: 'any'
        },
        {
            name: 'Linux',
            id: 'linux'
        },
        {
            name: 'Bash',
            id: 'bash'
        },
        {
            name: 'SQL',
            id: 'sql'
        },
        {
            name: 'Docker',
            id: 'docker'
        },
        {
            name: 'DevOps',
            id: 'devops'
        }
    ]
}];

export const getTruncatedAddress = (address: string) => {
    return address ? `${address.substring(0, 5)}...${address.substring(address.length - 5)}` : null;
}