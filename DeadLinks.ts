const {webkit} = require('playwright');
const fetch = require('node-fetch');
const fs = require('fs');
const controller = require('node-abort-controller');

let xpathWithBaseUrlCheck; //Fetch the xpath filtering the URLs in baseUrlCheck variable
let existingUrlsFlag = false; //If true, utility will run on the existing URLs from inputFile variable
let inputFile = "./Input.csv"; //Input file name if URL data already exists
let outputFile = "Output.csv"; //Output file name
let urlToCheck = "https://www.google.com/"; //URL for which utility needs to be executed
const baseUrlCheck = "google.com"; //URL will be fetched only containing the comma separate URLs in baseURLCheck
const urlsAttribute = "href"; //Attribute name in the applciation containing URL
const urlLevelCheck = 2; //Number of levels (Count of front Slash) for a URL to check
const numberOfThreads = 10; //Number of parallel threads
const pageLoadTimeout = 15000; //Page load time out
const fetchResponseTimeout = 5000; //API response timeout
const maxURLCheck = 50; //Make this check as blank if no limit is needed

let urlNotCheckedMap =  new Map();
let urlCheckedMap = new Map();
let responseCheckedMap  = new Map();

findDeadLinks();

/*
Description : This method finds the dead links in the URL given in the the global variable "urlToCheck"
*/
async function findDeadLinks() {
  console.log ("Starting Find Dead Links Utility");
  let arrayOfPromises = new Array(numberOfThreads);
  if (existingUrlsFlag == false){

    //Get Playwright page object
    const browser = await webkit.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    //Get the xpath of the URLs to be checked based on base url check
    xpathWithBaseUrlCheck = getURLCheckXpath();

    //Get the list of all the urls on the url to check
    await getUrlsFromCurrentPage(page,urlToCheck);

    //Fetching the URLs in parallel 
    for (let i = 0;i<numberOfThreads;i++){
      console.log("Started Parallel Execution To List Of URLs For Thread : " + i+1);
      arrayOfPromises[i]=getURLs(page,i+1)
    }

    //Wait untill fetch url parallel process is finished
    await processParallel(arrayOfPromises);
    
  } else{
    //Converts the existing list of URLs from CSV to Map
    urlCheckedMap = await convertCsvToMap(inputFile);      
  }
  
  //Fetched the response of the URLs in parallel
  for (let i = 0;i<numberOfThreads;i++){
    console.log("Started Parallel Execution To Fetch Response For Thread : " + i+1);
    arrayOfPromises[i]=fetchResponse(i+1)
  }
  
  //Wait untill url response is fetched for all the threads
  await processParallel(arrayOfPromises);

  //Generate a CSV file of all the reponses fetched
  await createCSVFile(responseCheckedMap);
}

/*
Description: This function process all the promises passed in "arrayOfPromises" in parallel
*/
async function processParallel(arrayOfPromises) {
  console.time('Processing Parallel')
  await Promise.all(arrayOfPromises)
  console.timeEnd('Processing Parallel')
  console.log('Processing Parallel Complete  \n')
  return;
}

/*
Description : Get the value of an attribute
@element: Playwright page element
@attribute: Attribute to be found
return:
@textValue: : Text Value of the attribute of the given element
*/
async function getAttribute(element,attribute) {
  const textValue =  await (await element).getAttribute(attribute).then(async function(value) {
    return value;
  });
  return textValue
}

/*
Description : Get the list of URLs recursively on a given URL
parameters: 
@page: Playwright page object
@thread: Active thread index
return : 
@urlCheckedMap : List of allt the URLs recursively found on the base url given in global parameter "urlToCheck"
*/
async function getURLs(page,thread) {

  //Limits the execution to the validation of maxURLCheck
  if (maxURLCheck==""){
    maxURLCheck == 100000000;
  }
  if (urlNotCheckedMap.size>0 && urlCheckedMap.size<maxURLCheck){
    //Fetches the URL to Check
    let urlCheck = "";
    // let urlCheck = urlNotCheckedMap.entries().next().value.toString().split(",")[0];
    urlNotCheckedMap.forEach (async function(value, key) {
      urlCheck = key;
    });

    //Deletes the URL to be checked from not checked map
    urlNotCheckedMap.delete(urlCheck);

    await getUrlsFromCurrentPage(page,urlCheck);
  
    console.log("URL Not Checked Map Size : " + urlNotCheckedMap.size + " for thread : " + thread)
    await getURLs(page,thread);
  }else{
    urlNotCheckedMap.forEach (async function(value, key) {
      urlCheckedMap.set(key,value);
    });
  }
}

/*
Description: This function returns all the urls on a given page
Parameter:
@page: Playwright page object
@urlcheck: Page URL from which all the links to be fetched
@thread: Active thread index
return : 
@urlCheckedMap : List of allt the URLs found on the base url given in global parameter "urlToCheck"
*/
async function getUrlsFromCurrentPage(page, urlToCheck){
  try{

    // Loads the page and get the page load time
    let pageLoadStartTime = new Date().getTime();
    await page.goto(urlToCheck, { timeout: pageLoadTimeout });
    let pageTitle = await page.title();
    let pageLoadEndTime = new Date().getTime();
    let pageLoadtime = pageLoadEndTime - pageLoadStartTime;    

    //Fetchs the list of all the URLs on a given page and fetched the link find time
    let elements = await page.$$(xpathWithBaseUrlCheck);
    let linkFetchEndTime = new Date().getTime();
    let linkFetchTime = linkFetchEndTime - pageLoadEndTime;
    urlCheckedMap.set(urlToCheck, pageTitle + "," + urlToCheck + "," + pageLoadtime + "," + linkFetchTime + ",Checked");
    for (let element of elements){
      let link = await getAttribute(element,urlsAttribute);
      if ((urlCheckedMap.get(link) == undefined)){
        //Ignores the URLs based on the level check passed in the global variable "urlLevelCheck"
        if (link.split("/").length <= (urlLevelCheck + 3)){
          urlNotCheckedMap.set(link,pageTitle + "," + urlToCheck + "," + pageLoadtime + "," + linkFetchTime + ",Not Checked");
        }else{
          urlCheckedMap.set(link, pageTitle + "," + urlToCheck + "," + pageLoadtime + "," + linkFetchTime + ",Checked: Based on URL Level Check " + urlLevelCheck);
        }
      }
      
    }
  }catch(err){
    //This condition validates if the URL is already processed by another thread
    if (!err.toString().includes("Navigation interrupted by another one")){
      urlCheckedMap.set(urlToCheck,",Error,Error,Error,Error Occurred : " + err.toString().replace(/,/g,"").replace(/(?:\r\n|\r|\n)/g, ""));
    }
    
  }
}

/*
Description: Get xpath to fetch the url based on the base on the urls passed in the global parameter "baseUrlCheck"
return:
@xpath: xpath of the Urls to be fetched based on multiple base url check
*/
function getURLCheckXpath(){
  let xpath = "";
  if (baseUrlCheck == ""){
    xpath = "a[href]";
  }else{
    let  urls = baseUrlCheck.split(",");
    let xpathConditions = "contains(@href,'" + urls[0] + "')"; 
    for (let i = 1; i < urls.length; i++) {
      xpathConditions = xpathConditions + " or " + "contains(@href,'" + urls[i] + "')"
    }
    xpath = "//a[" + xpathConditions + "]";
  } 
  console.log("Xpath of the URLs to be fetched : " + xpath);
  return xpath;
}


/*
Description: Fetched the API response/Info/Error of a given URL
return:
@responseCheckedMap : Hash Map containing the response/info/error of all the URLs
*/
async function fetchResponse(thread){ 
  if (urlCheckedMap.size > 0){
    let startTime = new Date().getTime();
    let urlKey = "";
    let urlKeyValue = "";

    //Fetched the URL to check response
    urlCheckedMap.forEach (async function(value, key) {
      urlKey = key;
      urlKeyValue = value;
    });
     
    urlCheckedMap.delete(urlKey);
    
    //Sets timeout for fetch response
    setTimeout(() => controller.abort, fetchResponseTimeout)

    //Get the reponse of a fetch request
    let responseCode = "";
    await fetch(urlKey,{ signal: controller.signal})
    .then(response => responseCode =  response.status.toString() + ":" + response.statusText.toString())
    .then(data => {
      responseCode= data; // do something with the API response data
    })
    .catch(error => {
      responseCode = error; // handle any errors that occurred during the request
    });

    let endTime = new Date().getTime();
    responseCheckedMap.set(urlKey,urlKeyValue + "," + responseCode + "," + (endTime-startTime));
  
    //Recursively fetched the response of the URLs untill response is fetched for all the URLs
    await fetchResponse(thread);
  }else{
    console.log("Execution finished for thread " + thread +  " as response Fetched for all the URLs")
  }
}

/*
Description : Create CSV File from HashMap
return: 
@outputFile : Creates an output file with the name passed in the parameter "outputFile"
*/
async function createCSVFile(dataMap){
  //List of headers to be added in CSV
  let headers = "URL,PageTitle,PageURL,PageLoadTime(ms),PageLinkFetchTime(ms),URLValidationStatus,ResponseCode,ResponseTime(ms)\n"; 
  let data = headers;
  dataMap.forEach (function(value, key) {
      data = data + key + "," + value + "\n";
  });
  
  fs.writeFile(outputFile, data, (err) => {          
      // In case of a error throw err.
      if (err) throw err;
  })
  console.log("File " + outputFile + " Created");
}


/*
Description : Reads Data from a file
*/
async function readData(fileName){
  return new Promise(resolve=>{
    fs.readFile(fileName,'utf8',function(err,data){
      if(err) throw err;
      resolve(data);
    });
  });
}

/*
Description: Converts the data from csv file into a Map
Parameters: 
@fileName : Name of the file to be converted to csv
return:
@dataMap: Map containing the CSV Data
*/
async function convertCsvToMap(fileName){
  let dataMap = new Map();
  const csvData = (await readData(fileName)).toString().split("\n");
  for (let line of csvData){
    //Filters the blank line and headers from the CSV
    if (!(line.toString() == "") && !(line.toString().startsWith("URL"))) {
      let fields = line.split(",");
      let key = fields[0];
      let value = "";
      for (let i=1; i<fields.length-2 ; i++){
        value = value + fields[i];
        if (!(i==(fields.length-3))){
          value = value + ",";
        }
      }
      dataMap.set(key,value);
    }
  }
  return dataMap;
}