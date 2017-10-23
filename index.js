const express = require('express');
const app = express();
const r2 = require('r2');
const moment = require('moment');

const PORT = process.env.PORT || 4000;
const API_KEY = process.env.API_KEY;

const CACHE = {};

const fetchAndCache = async (groupId) => {
  const url = `https://api.meetup.com/2/events?&sign=true&photo-host=public&group_id=${groupId}&status=upcoming&time=0d,1w&page=20&key=${API_KEY}`;
  const response = await r2(url).response;
  const events = await response.json();
  CACHE[groupId] = {
    events: events,
    expires: moment().add(1, 'day')
  };
  return events;
};

const getEvents = async (groupId) => {
  const cachedResponse = CACHE[groupId];
  let events;
  if (cachedResponse && moment().isBefore(cachedResponse.expires)) {
    events = cachedResponse.events;
  } else {
    events = await fetchAndCache(groupId);
  }

  return formatEvents(events);
};

const formatEvents = (events) => {
  return events.results.map(event => {
    let text = '';
    if (event.name.indexOf(event.group.name) !== 0) {
      text += `${event.group.name} presents `;
    }
    text += `${event.name} on ${moment(event.time).format('dddd, MMMM Do [at] h:mm a')}`;
    return {
      uid: event.created,
      updateDate: moment().utc().format(),
      titleText: event.group.name,
      mainText: text,
      redirectionURL: event.event_url
    }
  });
}

app.get('/feed/:groupId', async (req, res) => {
  const events = await getEvents(req.params.groupId);
  return res.json(events);
});

app.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
