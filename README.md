# DNS Testing Tool

Grabs the urls from a list of urls.
* Will append `https://` if missing.
* Will filter out empty lines and lines without a `.` in them.
* Any line that has a "01" in the url will be done 8 times, 01-08.

Outputs to a text or csv file.

### Environment
* Install Node.js 16.
* Run `npm install`.
* Run `npm run build && npm start` to run the tool.