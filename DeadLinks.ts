// const { Worker } = require('worker_threads');
const {webkit} = require('playwright');
const baseUrlCheck = "google.com";
const urlLevelCheck = 2;
const fetch = require('node-fetch');
findDeadLinks();

async function findDeadLinks() {
  const browser = await webkit.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  console.log ("Starting the utility");

  await page.goto("https://www.google.com/");

  //Base URL Check
  let links = "";
  if (baseUrlCheck == ""){
    links = await page.$$('a[href]');
  }else{
    //Links will be filtered if base url is not there
    links = await page.$$("//a[contains(@href,'" + baseUrlCheck + "')]");
  }

  // Get all the links on the page
  let hashMap = await getURLs(links,"href");

  hashMap  = await filterUrlLevelCheck(hashMap,urlLevelCheck);
  // let response = await page.goto("https://www.mercerabc.com");
  // console.log("Response : " + response.status());
  // await fetchResponse("");
  // hashMap.forEach (function(value, key) {
    // console.log(" Response : " + fetch("https://www.googlfffse.com").then(function(response) {
    //   return response.status;
    // }).then(function(data) {
    //   console.log(data);
    // }).catch(function(err) {
    //   console.log('Fetch Error :-S', err);
    // }));
  //     console.log("Response :" + response);
  //   }))
     
  // })
  
}

async function getAttribute(element,attribute) {
  const textValue =  await (await element).getAttribute(attribute).then(async function(value) {
    return value;
  });
  return textValue
}

async function getURLs(elements,attribute) {
  let hashMap =  new Map();
  for (let element of elements){
    let link = await getAttribute(element,attribute);
    hashMap.set(link,"Alive");
  }
  return hashMap
}

async function filterUrlLevelCheck(hashmap,urlLevelCheck){ 
  if (urlLevelCheck>0){
    let map = new Map();
    hashmap.forEach (function(value, key) {
      if (key.split("/").length <= (urlLevelCheck + 2)){
        map.set(key,value);
      }
    })
    return map;
    }else{
      return hashmap;
    }
  }

  // async function fetchResponse(url){
  //   console.log(" Response : " + await fetch("http://www.google.com").then(reponse => console.log("Response : " + reponse)))
  // }