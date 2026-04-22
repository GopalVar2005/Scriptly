const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m"
};

const getTimestamp = () => new Date().toISOString();

const logger = {
  info: (tag, message) => {
    console.log(`${colors.cyan}[${getTimestamp()}] ${colors.blue}${tag}${colors.reset} ${message}`);
  },
  warn: (tag, message) => {
    console.log(`${colors.cyan}[${getTimestamp()}] ${colors.yellow}${tag}${colors.reset} ${message}`);
  },
  error: (tag, message, err = "") => {
    console.error(`${colors.cyan}[${getTimestamp()}] ${colors.red}${tag}${colors.reset} ${message}`, err);
  },
  success: (tag, message) => {
    console.log(`${colors.cyan}[${getTimestamp()}] ${colors.green}${tag}${colors.reset} ${message}`);
  }
};

module.exports = logger;
