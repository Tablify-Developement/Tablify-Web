import chalk from 'chalk';

// ANSI art for "Tablify"
const TABLIFY_LOGO = `
${chalk.bold.magenta('████████╗ █████╗ ██████╗ ██╗     ██╗███████╗██╗   ██╗')}
${chalk.bold.magenta('╚══██╔══╝██╔══██╗██╔══██╗██║     ██║██╔════╝╚██╗ ██╔╝')}
${chalk.bold.magenta('   ██║   ███████║██████╔╝██║     ██║█████╗   ╚████╔╝ ')}
${chalk.bold.magenta('   ██║   ██╔══██║██╔══██╗██║     ██║██╔══╝    ╚██╔╝  ')}
${chalk.bold.magenta('   ██║   ██║  ██║██████╔╝███████╗██║██║        ██║   ')}
${chalk.bold.magenta('   ╚═╝   ╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝╚═╝        ╚═╝   ')}
`;

// Logger with ANSI art
export const logger = {
    // Log the Tablify logo
    logLogo: () => console.log(TABLIFY_LOGO),

    // Log a success message
    success: (message: string) => console.log(chalk.green.bold(`[SUCCESS] ${message}`)),

    // Log an error message
    error: (message: string) => console.log(chalk.red.bold(`[ERROR] ${message}`)),

    // Log an info message
    info: (message: string) => console.log(chalk.blue.bold(`[INFO] ${message}`)),

    // Log a warning message
    warn: (message: string) => console.log(chalk.yellow.bold(`[WARN] ${message}`)),

    // Log a connection success message
    connection: (message: string) => console.log(chalk.magenta.bold(`[CONNECTION] ${message}`)),
};