module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: './',
    testMatch: [
        '**/__tests__/**/*.ts',
        '**/*.test.ts'
    ],
    transform: {
        '^.+\.ts$': 'ts-jest'
    }
};