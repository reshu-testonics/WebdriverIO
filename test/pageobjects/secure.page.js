const Page = require('./page');

/**
 * sub page containing specific selectors and methods for a specific page
 */
class SecurePage extends Page {
    /**
     * define selectors using getter methods
     */
    get flashAlert () { return $('#flash') }
    get secureAreaElement () { return $('div[class="example"] h2') }
    get messageElement () { return $('#flash') }
}

module.exports = new SecurePage();
