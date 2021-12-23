import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import listEndpoints from 'express-list-endpoints';
import topMusicData from './data/top-music.json';

const mongoUrl =
  process.env.MONGO_URL || 'mongodb://localhost/jesfal-project-mongo';
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

// Defines the port the app will run on.
const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json 
app.use(cors());
app.use(express.json());

// middleware checks if the database is connected before going forward to our endpoints.

app.use((req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next();
  } else {
    res.status(503).json({ error: 'Service unavailable' });
  }
});

const Track = mongoose.model('Track', {
  id: Number,
  trackName: String,
  artistName: String,
  genre: String,
  bpm: Number,
  energy: Number,
  danceability: Number,
  loudness: Number,
  liveness: Number,
  valence: Number,
  length: Number,
  acousticness: Number,
  speechiness: Number,
  popularity: Number,
});

// Resets database,deletes previous data. saves new. Prevents duplications.
if (process.env.RESET_DB) {
  const seedDataBase = async () => {
    await Track.deleteMany({});

    topMusicData.forEach((item) => {
      const newTrack = new Track(item);
      newTrack.save();
    });
  };

  seedDataBase();
}

// Defining routes starts here
app.get('/', (req, res) => {
  res.send(
    'Hello! Music DB here'
  );
});
// endpoints
app.get('/endpoints', (req, res) => {
  res.send(listEndpoints(app));
});

// get the songs 

app.get('/songs', async (req, res) => {
  let songs = await Track.find(req.query);
  if (songs) {
   
    // show all songs with a bom of 10 or higher.
    if (req.query.bpm) {
      const songsByBpm = await Track.find().gt('bpm', req.query.bpm);
      songs = songsByBpm;
    }
    res.json(songs);
  } else {
    res.status(404).json({ error: 'No such song exists' });
  }
});

// Get track by id. 
app.get('/songs/id/:id', async (req, res) => {
  try {
    const songById = await Track.findById(req.params.id);
    if (songById) {
      res.json(songById);
    } else {
      res.status(404).json({ error: 'Id does not exist' });
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid id' });
  }
});

// get song by title.
app.get('/songs/title/:trackName', async (req, res) => {
  try {
    const songByTitle = await Track.findOne({
      trackName: req.params.trackName,
    });
    if (songByTitle) {
      res.json(songByTitle);
    } else {
      res.status(404).json({ error: 'Title not found' });
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid title' });
  }
});

// Get artist.
app.get('/songs/artist/:artistName', async (req, res) => {
  const songByArtist = await Track.find({ artistName: req.params.artistName });
  if (songByArtist) {
    res.json(songByArtist);
  } else {
    res.status(404).json({ error: 'Artist not found' });
  }
});

// get a specific genre.
app.get('/songs/genre/:genre', async (req, res) => {
  const songByGenre = await Track.find({ genre: req.params.genre });
  if (songByGenre) {
    res.json(songByGenre);
  } else {
    res.status(404).json({ error: 'Genre not found' });
  }
});

// Start the server
app.listen(port, () => {
  // eslint-disable-next-line
  console.log(`Server running on http://localhost:${port}`);
});