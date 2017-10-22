const express = require('express');
const app = express();
const r2 = require('r2');
const moment = require('moment');

const PORT = process.env.PORT || 4000;
const API_KEY = process.env.API_KEY;

const groupURL = 'https://cdn.rawgit.com/jsoxford/hubot/f15a1386/meetup-groups.json';
let groups = [];

app.get('/feed', async (req, res) => {
  const url = `https://api.meetup.com/2/events?&sign=true&photo-host=public&group_id=${groups.join(',')}&status=upcoming&time=1d,1w&page=20&key=${API_KEY}`;
  const response = await r2(url).response;
  const events = (await response.json()).results.map(event => {
    return {
      uid: event.created,
      updateDate: moment().utc().format(),
      titleText: event.group.name,
      mainText: `${event.group.name} - ${event.name} - ${moment(event.time).format('dddd, MMMM Do, h:mm:ss a')}`
    }
  });
  return res.json(events);
});

app.listen(PORT, async () => {
  const response = await r2(groupURL).response;
  groups = await response.json();
  groups = Object.keys(groups).filter(id => !groups[id].outOfOxford);
  console.log(`Server listening on http://localhost:${PORT}`);
});
