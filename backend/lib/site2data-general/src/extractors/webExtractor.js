const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

/**
 * Web data extractor
 */
class WebExtractor {
  /**
   * Extract data from a website
   * @param {string} url - URL of the website
   * @param {Object} selectors - CSS selectors for data extraction
   * @param {boolean} usePuppeteer - Whether to use Puppeteer for JavaScript-rendered content
   * @returns {Promise<Object>} Extracted data
   */
  async extract(url, selectors = {}, usePuppeteer = false) {
    try {
      let html;
      
      if (usePuppeteer) {
        html = await this._loadWithPuppeteer(url);
      } else {
        html = await this._loadWithAxios(url);
      }
      
      const extractedData = this._extractDataFromHtml(html, selectors);
      
      return extractedData;
    } catch (error) {
      console.error('Error extracting web data:', error);
      throw error;
    }
  }
  
  /**
   * Load webpage using Axios (for static content)
   * @param {string} url - URL to load
   * @returns {Promise<string>} HTML content
   */
  async _loadWithAxios(url) {
    const response = await axios.get(url);
    return response.data;
  }
  
  /**
   * Load webpage using Puppeteer (for JavaScript-rendered content)
   * @param {string} url - URL to load
   * @returns {Promise<string>} HTML content
   */
  async _loadWithPuppeteer(url) {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });
      const html = await page.content();
      return html;
    } finally {
      await browser.close();
    }
  }
  
  /**
   * Extract data from HTML using provided selectors
   * @param {string} html - HTML content
   * @param {Object} selectors - CSS selectors
   * @returns {Object} Extracted data
   */
  _extractDataFromHtml(html, selectors) {
    const $ = cheerio.load(html);
    const result = {};
    
    // Extract data using the provided selectors
    for (const [key, selectorInfo] of Object.entries(selectors)) {
      let selector, attribute, multiple;
      
      if (typeof selectorInfo === 'string') {
        selector = selectorInfo;
        attribute = 'text';
        multiple = false;
      } else {
        selector = selectorInfo.selector;
        attribute = selectorInfo.attribute || 'text';
        multiple = selectorInfo.multiple || false;
      }
      
      if (multiple) {
        result[key] = [];
        $(selector).each((_, element) => {
          result[key].push(this._extractElementData($, element, attribute));
        });
      } else {
        result[key] = this._extractElementData($, $(selector)[0], attribute);
      }
    }
    
    return result;
  }
  
  /**
   * Extract data from a DOM element
   * @param {Object} $ - Cheerio instance
   * @param {Object} element - DOM element
   * @param {string} attribute - Attribute to extract
   * @returns {string} Extracted data
   */
  _extractElementData($, element, attribute) {
    if (!element) return null;
    
    if (attribute === 'text') {
      return $(element).text().trim();
    } else if (attribute === 'html') {
      return $(element).html();
    } else {
      return $(element).attr(attribute);
    }
  }
}

module.exports = new WebExtractor(); 