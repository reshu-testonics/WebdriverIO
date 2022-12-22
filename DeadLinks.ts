const { Worker } = require('worker_threads');
const {webkit} = require('playwright');
let urlToCheck = "https://www.google.com/";
const baseUrlCheck = "google.com";
const urlLevelCheck = 2;
const fetch = require('node-fetch');
const fs = require('fs');
let urlNotCheckedMap =  new Map();
let urlCheckedMap = new Map();

findDeadLinks();

async function findDeadLinks() {
  const browser = await webkit.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  console.log ("Starting the utility");

  // Get all the links on the page
  let hashMap = await getURLs(page);
  // hashMap  = await filterUrlLevelCheck(hashMap,urlLevelCheck);
  
  hashMap = await fetchResponse(hashMap);
  
  await createCSVFile(hashMap);
}

/*
Description : Get the value of an attribute
*/
async function getAttribute(element,attribute) {
  const textValue =  await (await element).getAttribute(attribute).then(async function(value) {
    return value;
  });
  return textValue
}

/*
Description : Get the list of URLs
*/
async function getURLs(page) {
  
  const attribute ="href";
  console.log("Fetching the URLs and saving in hash map")

  console.log("URL To check : " + urlToCheck);
  try{

    let pageLoadStartTime = new Date().getTime();
    await page.goto(urlToCheck);
    let pageTitle = await page.title();
    let pageLoadEndTime = new Date().getTime();

    let pageLoadtime = pageLoadEndTime - pageLoadStartTime;
    //Base URL Check
    let links = await page.$$(getURLCheckXpath());
    // if (baseUrlCheck == ""){
    //   links = await page.$$('a[href]');
    // }else{
    //   //Links will be filtered if base url is not there
    //   links = await page.$$("//a[contains(@href,'" + baseUrlCheck + "')]");
    // }
    let linkFetchEndTime = new Date().getTime();
    let linkFetchTime = linkFetchEndTime - pageLoadEndTime;

    urlCheckedMap.set(urlToCheck, pageTitle + "," + urlToCheck + "," + pageLoadtime + "," + linkFetchTime + ",Checked");
    for (let element of links){
      let link = await getAttribute(element,attribute);
      if ((urlCheckedMap.get(link) == undefined)){
        if (link.split("/").length <= (urlLevelCheck + 2)){
          urlNotCheckedMap.set(link,pageTitle + "," + urlToCheck + "," + pageLoadtime + "," + linkFetchTime + ",Not Checked");
          console.log("URL Check Not Started : " + link);
        }else{
          urlCheckedMap.set(link, pageTitle + "," + urlToCheck + "," + pageLoadtime + "," + linkFetchTime + ",Checked: Based on URL Level Check " + urlLevelCheck);
          console.log("URL Check Completed : " + link);
        }
      }
      
    }

  }catch(err){
    urlCheckedMap.set(urlToCheck,err.toString());
  }
  
  console.log("urlNotCheckedMap size : " + urlNotCheckedMap.size)
  if (urlNotCheckedMap.size>0 && urlNotCheckedMap.size<150){
    urlToCheck = "";
    urlNotCheckedMap.forEach (async function(value, key) {
      urlToCheck = key;
    });
    urlNotCheckedMap.delete(urlToCheck);
    await getURLs(page);
  }else{
    urlNotCheckedMap.forEach (async function(value, key) {
      urlCheckedMap.set(key,value + ",Completed");
    });
  }
  return urlCheckedMap;
}


function getURLCheckXpath(){
  let xpath = "";
  if (baseUrlCheck == ""){
    xpath = "a[href]";
  }else{
    let  urls = baseUrlCheck.split(",");
    console.log("URLs : " + urls);
    console.log("URLs : " + urls.length);
    let conditions = "contains(@href,'" + urls[0] + "')"; 
    for (let i = 1; i < urls.length; i++) {
      console.log("conditions : " + conditions);
      conditions = conditions + " or " + "contains(@href,'" + urls[i] + "')"
    }
    xpath = "//a[" + conditions + "]";
  } 
  console.log("Xpath: " + xpath);
  return xpath;
  // if (baseUrlCheck.split(",").length==0){
  //   xpath = "a[href]";
  //   //Links will be filtered if base url is not there
  //   links = await page.$$("//a[contains(@href,'" + baseUrlCheck + "')]");
  // }
}

/*
Description : Filter the hasmap based on URL check
*/
async function filterUrlLevelCheck(hashmap,urlLevelCheck){ 
  console.log("URL Count Before URL Level Check Filter : " + hashmap.size)
  if (urlLevelCheck>0){
    let map = new Map();
    hashmap.forEach (function(value, key) {
      if (key.split("/").length <= (urlLevelCheck + 2)){
        map.set(key,value);
      }
    })
    console.log("URL Count After URL Level Check Filter : " + map.size)
    return map;
    }else{
      console.log("URL Count After URL Level Check Filter : " + hashmap.size)
      return hashmap;
    }
  }

  /*
  Description : Fetch URL Response
  */
  async function fetchResponse(hashMap){
    console.log("Starting to fetch response")
    let map = new Map();
    let keys= "";
    hashMap.forEach (async function(value, key) {
      keys = keys + key + ",";  
    });
    let k = keys.split(",");
    for (let i = 0; i < k.length-1; i++) {
      let startTime = new Date().getTime();
      let key = k[i];
      let responseCode = "";
      await fetch(key)
      .then(response => responseCode =  response.status.toString())
      .then(data => {
        responseCode= data
        // do something with the API response data
      })
      .catch(error => {
        responseCode = error
        // handle any errors that occurred during the request
      });
      let endTime = new Date().getTime();
      map.set(key,hashMap.get(key) + "," + responseCode + "," + (endTime-startTime));
    }
    console.log("Response fetched for all the URLs");
    return map;
  }

  /*
  Description : Create CSV File from HashMap
  */
  async function createCSVFile(hashMap){
    let data = "URL,PageTitle,PageURL,PageLoadTime(ms),PageLinkFetchTime(ms),URLValidationStatus,ResponseCode,ResponseTime(ms)\n";
    hashMap.forEach (function(value, key) {
        data = data + key + "," + value + "\n";
    });
    
    fs.writeFile('Output.csv', data, (err) => {          
        // In case of a error throw err.
        if (err) throw err;
    })
    console.log("File Created");
  }

  