var _ = require('lodash');
var parseUrl = require("parse-url");
var puppeteer = require("puppeteer");
var browser;
var page;

//set jest command timeout
jest.setTimeout(600000);

beforeEach( async ()=>{
    console.log("Starting Browser")
    browser = await puppeteer.launch({defaultViewport: {width: 1600, height: 900},headless: false,devtools: false,ignoreHTTPSErrors: true,args:[`--window-size=${1600},${900}`],ignoreDefaultArgs: ['--enable-automation']})
    page = await browser.newPage();
});

afterEach( async ()=>{
    //this wait is just for demo purposes
    await page.waitFor(4000);
    console.log("Killing Browser")
    browser.close();
});

test('Carsales Homepage - Pageload and Button Click', async ()=> {
    var requests = [];
    var foundPageview = false;
    var foundButtonClick = false;

    //start recording network traffic
    page.on('request', request => requests.push(request));
    
    //Perform site actions
    await page.goto('https://www.carsales.com.au/');
    await page.waitForSelector('#csnSearchButton');
    await page.click('#csnSearchButton');
    
    //map recorded requests
    let urls = _.map(requests, _.partialRight(_.pick, ['_url','_postData']))
    
    //go through recorded requests and check for the urls required
    _.forEach(urls, function(url) {
        if(url._url.includes('https://www.google-analytics.com/r/collect?') || url._url.includes('https://www.google-analytics.com/collect?'))
        {
            let parsedUrl = parseUrl(url._url);

            //now check for the expected values in the request
            if(parsedUrl.query.t == 'pageview'){
                expect(parsedUrl.query.cg1).toBe('homepage');
                expect(parsedUrl.query.cg2).toBe('homepage');
                expect(parsedUrl.query.dt).toBe('Carsales | Australia’s No.1 Car Website – carsales.com.au');
                foundPageview = true;
            }
        }
        else if(typeof url._postData !== 'undefined' && (url._url.includes('https://www.google-analytics.com/r/collect') || url._url.includes('https://www.google-analytics.com/collect'))){
            
            correctUrl = url._url+"?"+url._postData;
            parsedUrl = parseUrl(correctUrl);
            
            //now check for the expected values in the request
            if(parsedUrl.query.t == 'event'){
                expect(parsedUrl.query.ea).toBe('click');
                expect(parsedUrl.query.el).toBe('search')
                foundButtonClick = true;
            }
        }
    });
    if(!foundPageview || !foundButtonClick){
        expect("Could not find the expected url").toBe(":(");
    }
})