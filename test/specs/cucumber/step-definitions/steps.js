const { Given, When, Then } = require('@cucumber/cucumber');
const LoginPage = require('../../../pageobjects/login.page');
const SecurePage = require('../../../pageobjects/secure.page');

Given('the user is on login page', async function () {
    await LoginPage.open(global.url);
    await expect(browser).toHaveTitle('The Internet');
});

When('the user enters username as {string} and password as {string}', async function (username, password) {
    await LoginPage.inputUsername.setValue(username)
    await LoginPage.inputPassword.setValue(password)
});

When('clicks on login button', async function () {
    await LoginPage.btnSubmit.click()
});

Then('the user must navigate to secure area page displaying a message {string}', function (successMessage) {    
    expect(SecurePage.secureAreaElement).toExist()
    expect(SecurePage.secureAreaElement).toHaveTextContaining('Secure Area')
    expect(SecurePage.messageElement).toExist()
    expect(SecurePage.messageElement).toHaveTextContaining(successMessage)
});

Then('the user must remain on login page displaying a message {string}', function (errorMessage) {
    expect(LoginPage.loginPageElement).toExist()
    expect(LoginPage.loginPageElement).toHaveTextContaining('Login Page')
    expect(LoginPage.messageElement).toExist()
    expect(LoginPage.messageElement).toHaveTextContaining(errorMessage)
});