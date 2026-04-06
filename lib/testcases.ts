export interface TestCase {
    stdin: string;
    expected: string;
}

export interface ProblemTestCases {
    cases: TestCase[];
}

// Maps exact Problem Titles to their test cases
export const predefinedTestCases: Record<string, ProblemTestCases> = {
    "Two Sum": {
        cases: [
            { stdin: "4\n2 7 11 15\n9", expected: "0 1" },
            { stdin: "3\n3 2 4\n6", expected: "1 2" }
        ]
    },
    // Add more predefined ones here
};

export const fallbackTestCases: ProblemTestCases = {
    cases: [
        { stdin: "Hello", expected: "Hello" } // just a basic compile+run success checker if no specific tests
    ]
};
