function HaltError(message) {
    this.name = 'HaltError';
    this.message = message;
    this.stack = (new Error()).stack;
}
HaltError.prototype = new Error();

module.exports = HaltError;