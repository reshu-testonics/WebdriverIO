import { Given, When, Then } from '@cucumber/cucumber'
import Axios from '../../../../utilities/axios';

When('Get API request is made', async function () {
    await Axios.getRequest("http://webcode.me")
});

Then('The request should be successful', async function (username, password) {
    console.log("API request is successful")
});