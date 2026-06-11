const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Load models
const User = require('./models/User');
const Meetup = require('./models/Meetup');
const Registration = require('./models/Registration');
const Message = require('./models/Message');
const Connection = require('./models/Connection');
const Video = require('./models/Video');

// Dummy video binary contents (a tiny valid 1-second blank mp4 file representation to prevent player crashes)
const tinyMp4Base64 = 
  'AAAAIGZ0eXBpc29tAAAAAGlzb21tcDQxAAAACHZyZWQAAAAIZnJlZQAAAuhtZGF0' +
  'IhAD5/+/g38R7Q/2BwP38G/iPaH+wOB+/g38R7Q/2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  '38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g' +
  '38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/i' +
  'PaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7Q' +
  'L2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+w' +
  'OB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP38G/iPaH+wOB+/g38R7QL2BwP' +
  'Mzs3c3VwZXIA';

const run = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Database connected!');

    // Clear existing data (optional but good for seed)
    console.log('Clearing old data...');
    await User.deleteMany({});
    await Meetup.deleteMany({});
    await Registration.deleteMany({});
    await Message.deleteMany({});
    await Connection.deleteMany({});
    await Video.deleteMany({});

    console.log('Seeding profiles...');

    // 1. Create Users
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('password123', salt);
    const adminPassword = await bcrypt.hash('admin123', salt);

    // Main Admin User
    const admin = await User.create({
      name: 'Peru Enti Admin',
      email: 'admin@peruenti.com',
      password: adminPassword,
      profession: 'Head of Community',
      company: 'Peru Enti',
      lookingFor: ['Networking', 'Organizing Events', 'Sponsorships'],
      role: 'admin',
      isOnline: true
    });

    // Mock User Profiles
    const alice = await User.create({
      name: 'Alice Vance',
      email: 'alice@peruenti.com',
      password: hashedPassword,
      profession: 'Senior Software Engineer',
      company: 'Google',
      lookingFor: ['React 19', 'Web3 Architectures', 'Node.js Microservices'],
      role: 'user',
      isOnline: true
    });

    const bob = await User.create({
      name: 'Bob Miller',
      email: 'bob@peruenti.com',
      password: hashedPassword,
      profession: 'Principal Product Manager',
      company: 'Stripe',
      lookingFor: ['Fintech scaling', 'SaaS pricing engines', 'Leadership mentoring'],
      role: 'user',
      isOnline: false
    });

    const clara = await User.create({
      name: 'Clara Diaz',
      email: 'clara@peruenti.com',
      password: hashedPassword,
      profession: 'Lead UX Designer',
      company: 'Figma',
      lookingFor: ['Design Systems', 'UX Prototypes', 'AI-assisted design tools'],
      role: 'user',
      isOnline: true
    });

    const david = await User.create({
      name: 'David Chen',
      email: 'david@peruenti.com',
      password: hashedPassword,
      profession: 'Developer Relations Advocate',
      company: 'Vercel',
      lookingFor: ['Next.js App Router', 'Tailwind CSS v4 styling', 'Serverless APIs'],
      role: 'user',
      isOnline: false
    });

    const emily = await User.create({
      name: 'Emily Torres',
      email: 'emily@peruenti.com',
      password: hashedPassword,
      profession: 'AI/ML Engineer',
      company: 'OpenAI',
      lookingFor: ['LLMs', 'RAG pipelines', 'Python async patterns'],
      role: 'user',
      isOnline: true
    });

    const marcus = await User.create({
      name: 'Marcus Lee',
      email: 'marcus@peruenti.com',
      password: hashedPassword,
      profession: 'Full-Stack Developer',
      company: 'Shopify',
      lookingFor: ['GraphQL', 'Remix.run', 'Postgres optimization'],
      role: 'user',
      isOnline: true
    });

    console.log('Seeding connection requests...');

    // 2. Connections
    const now = new Date();
    const pairs = [
      [admin, alice], [admin, clara], [admin, emily], [admin, marcus],
      [alice, bob], [alice, clara], [alice, david],
      [bob, clara], [bob, emily],
      [clara, david], [clara, marcus],
      [david, emily], [emily, marcus]
    ];
    for (const [a, b] of pairs) {
      await Connection.create({ requester: a._id, recipient: b._id, status: 'accepted' });
      await Connection.create({ requester: b._id, recipient: a._id, status: 'accepted' });
    }
    // Bob -> Admin (extra pending)
    await Connection.create({ requester: bob._id, recipient: marcus._id, status: 'pending' });

    console.log('Seeding rich message history...');

    const createThread = async (userA, userB, msgs, baseOffset = 0) => {
      const base = Date.now() - baseOffset;
      for (let i = 0; i < msgs.length; i++) {
        const [from, content] = msgs[i];
        await Message.create({
          sender: from === 'a' ? userA._id : userB._id,
          receiver: from === 'a' ? userB._id : userA._id,
          content,
          read: true,
          createdAt: new Date(base + i * 4 * 60 * 1000)
        });
      }
    };

    // Admin <-> Alice
    await createThread(admin, alice, [
      ['a', 'Hi Alice! Welcome to Peru Enti. Looking forward to having you at our next tech meetup 🎉'],
      ['b', 'Hey! Thanks so much! Super excited. I was thinking of doing a React 19 lightning talk — would that work?'],
      ['a', 'Absolutely! I will reserve a 10-minute slot for you. Do you need AV setup or screen share?'],
      ['b', 'Screen share would be great. I have some live demos prepared. Will share the slides tomorrow.'],
      ['a', 'Perfect. Looking forward to it! The venue holds 80 people, should be a great crowd 👏'],
    ], 5 * 60 * 60 * 1000);

    // Admin <-> Clara
    await createThread(admin, clara, [
      ['b', 'Hello! I saw you are planning a design-focused meetup. Would love to give feedback on the topic list!'],
      ['a', 'Hi Clara! That would be amazing. I will DM you the draft tonight. Any particular themes you are excited about?'],
      ['b', 'Design tokens, component APIs, and accessibility are top of my list. Figma has some incredible new features too.'],
      ['a', 'Great input! We should definitely include an accessibility workshop. Can you co-facilitate?'],
      ['b', 'Count me in! This is going to be a fantastic event 🌟'],
    ], 8 * 60 * 60 * 1000);

    // Alice <-> Bob
    await createThread(alice, bob, [
      ['a', 'Hey Bob! I loved your talk on Stripe\'s pricing engine. Any chance you could share the slides?'],
      ['b', 'Of course! I will send them over. The core part was around usage-based billing with Stripe Meters.'],
      ['a', 'That is exactly what my startup needs. We are moving from flat-rate to usage pricing next quarter.'],
      ['b', 'Happy to do a quick call to walk you through the architecture. Would Tuesday work?'],
      ['a', 'Tuesday at 4PM IST is perfect. Sending a calendar invite now! 📅'],
    ], 12 * 60 * 60 * 1000);

    // Clara <-> David
    await createThread(clara, david, [
      ['a', 'David! I saw you posted about Tailwind v4. Mind if I pick your brain about the new theming API?'],
      ['b', 'Not at all! The CSS-first approach is a game changer. No more tailwind.config.js headaches.'],
      ['a', 'Exactly what I needed to hear. I am rebuilding our design system and was debating which approach to take.'],
      ['b', 'Go for it. The @theme block in CSS is so much more intuitive. I can share some examples from my open-source work.'],
      ['a', 'Please do! I will buy the coffee if we can have a session this week ☕'],
    ], 6 * 60 * 60 * 1000);

    // Emily <-> Marcus
    await createThread(emily, marcus, [
      ['a', 'Hey Marcus! Are you coming to the Serverless workshop next week?'],
      ['b', 'Definitely! I need to sort out our cold start issues on Shopify\'s edge functions.'],
      ['a', 'Oh I have been deep in that problem for OpenAI\'s API gateway. Edge + streaming is tricky.'],
      ['b', 'Sounds painful 😅 We should pair on it. GraphQL subscriptions over streaming is on my radar too.'],
      ['a', 'Yes! Let\'s sync after the workshop. I have some patterns that might save you days of debugging 🔧'],
    ], 3 * 60 * 60 * 1000);

    // Admin <-> Emily  
    await createThread(admin, emily, [
      ['a', 'Emily, welcome to Peru Enti! Your AI/ML background is exactly what our community needs 🚀'],
      ['b', 'Thank you! Really happy to be here. Are there any ML-focused sessions planned?'],
      ['a', 'Not yet, but we would love for you to lead one! LLM apps and RAG pipelines would be a huge hit.'],
      ['b', 'I would be honoured! How about a hands-on workshop — attendees build a mini RAG pipeline live?'],
      ['a', 'That sounds incredible. Let\'s plan it for next month. I will create the meetup today! 🎯'],
    ], 1 * 60 * 60 * 1000);

    console.log('Seeding video event recordings...');

    // Ensure video uploads directory exists
    const uploadsDir = path.join(__dirname, 'uploads', 'videos');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Write tiny blank mp4s
    const mp4Buffer = Buffer.from(tinyMp4Base64, 'base64');
    fs.writeFileSync(path.join(uploadsDir, 'react19.mp4'), mp4Buffer);
    fs.writeFileSync(path.join(uploadsDir, 'tailwind.mp4'), mp4Buffer);
    fs.writeFileSync(path.join(uploadsDir, 'serverless.mp4'), mp4Buffer);

    // 4. Create Video Records
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 28); // 28 days validity

    await Video.create({
      title: 'React 19 Hooks & Concurrent Rendering Features',
      description: 'A walkthrough of useActionState, useOptimistic, and asset loading updates in React 19.',
      filePath: '/uploads/videos/react19.mp4',
      uploadedBy: alice._id,
      expiresAt,
      fileSize: mp4Buffer.length
    });

    await Video.create({
      title: 'Tailwind CSS v4: Designing Premium Glass Interfaces',
      description: 'David Chen explains the new CSS-first compiler architecture and utility extensions in Tailwind v4.',
      filePath: '/uploads/videos/tailwind.mp4',
      uploadedBy: david._id,
      expiresAt,
      fileSize: mp4Buffer.length
    });

    await Video.create({
      title: 'Deploying High-Performance Serverless Applications on Vercel',
      description: 'Best practices for caching, Edge functions, and optimizing cold starts on Vercel deployments.',
      filePath: '/uploads/videos/serverless.mp4',
      uploadedBy: david._id,
      expiresAt,
      fileSize: mp4Buffer.length
    });

    // --- Start of Meetups Seeding ---
    console.log('Seeding meetups and registrations...');
    const organizers = [
      { name: 'Coding Club', email: 'codingclub@peruenti.com', profession: 'Official Student Club' },
      { name: 'Entrepreneurship Cell', email: 'ecell@peruenti.com', profession: 'Incubator & Cell' },
      { name: 'Tech Society', email: 'techsociety@peruenti.com', profession: 'Technical Society' },
      { name: 'AI Club', email: 'aiclub@peruenti.com', profession: 'Artificial Intelligence Club' },
      { name: 'Developer Community', email: 'devcomm@peruenti.com', profession: 'Developer Community' }
    ];

    const organizerMap = {};
    for (const org of organizers) {
      const userObj = await User.create({
        name: org.name,
        email: org.email,
        password: hashedPassword,
        profession: org.profession,
        company: 'Peru Enti',
        lookingFor: ['Organizing Events', 'Sponsorships'],
        role: 'admin',
        isOnline: false
      });
      organizerMap[org.name] = userObj._id;
    }

    const attendees = [];
    for (let i = 1; i <= 80; i++) {
      const attendee = await User.create({
        name: `Attendee ${i}`,
        email: `attendee${i}@peruenti.com`,
        password: hashedPassword,
        profession: i % 2 === 0 ? 'Software Engineer' : 'Product Designer',
        company: i % 3 === 0 ? 'Tech Corp' : (i % 3 === 1 ? 'Design Studio' : 'Freelance'),
        lookingFor: ['Networking', 'Learning new skills'],
        role: 'user',
        isOnline: false
      });
      attendees.push(attendee);
    }

    const meetupsData = [
      {
        title: 'DSA Live Coding Session',
        description: 'Practice data structures and algorithms with real-time problem solving. We will cover array manipulation, dynamic programming, and system optimization tricks.',
        date: new Date('2026-06-09T15:00:00'),
        startTime: '3:00 PM',
        endTime: '5:00 PM',
        venue: 'Online (Google Meet)',
        capacity: 50,
        registeredCount: 42,
        checkedInCount: 30,
        organizerName: 'Coding Club',
        status: 'ongoing',
        registrationDeadline: new Date('2026-06-08T23:59:00')
      },
      {
        title: 'Startup Idea Brainstorm',
        description: 'Collaborate and build innovative startup ideas with peers. Bring your raw concepts, formulate pitch decks, and validate target user personas together.',
        date: new Date('2026-06-09T16:00:00'),
        startTime: '4:00 PM',
        endTime: '6:00 PM',
        venue: 'Innovation Lab, Block A',
        capacity: 30,
        registeredCount: 25,
        checkedInCount: 18,
        organizerName: 'Entrepreneurship Cell',
        status: 'ongoing',
        registrationDeadline: new Date('2026-06-08T23:59:00')
      },
      {
        title: 'Full Stack Web Development Bootcamp',
        description: 'Learn React, Node.js, and databases in a hands-on workshop. Build a functional full stack application from scratch and deploy it instantly.',
        date: new Date('2026-06-12T10:00:00'),
        startTime: '10:00 AM',
        endTime: '4:00 PM',
        venue: 'Seminar Hall 2',
        capacity: 100,
        registeredCount: 78,
        checkedInCount: 0,
        organizerName: 'Tech Society',
        status: 'upcoming',
        registrationDeadline: new Date('2026-06-11T23:59:00')
      },
      {
        title: 'AI & Machine Learning Basics',
        description: 'Introduction to AI concepts and real-world applications. Understand the principles of linear regression, decision trees, and neural networks with hands-on labs.',
        date: new Date('2026-06-14T11:00:00'),
        startTime: '11:00 AM',
        endTime: '1:00 PM',
        venue: 'Online (Zoom)',
        capacity: 80,
        registeredCount: 60,
        checkedInCount: 0,
        organizerName: 'AI Club',
        status: 'upcoming',
        registrationDeadline: new Date('2026-06-13T23:59:00')
      },
      {
        title: 'Hackathon Team Formation',
        description: 'Find teammates and form teams for upcoming hackathons. Meet developer, designer, and PM profiles and pitch your project ideas.',
        date: new Date('2026-06-15T17:00:00'),
        startTime: '5:00 PM',
        endTime: '7:00 PM',
        venue: 'Cafeteria',
        capacity: 40,
        registeredCount: 32,
        checkedInCount: 0,
        organizerName: 'Developer Community',
        status: 'upcoming',
        registrationDeadline: new Date('2026-06-14T23:59:00')
      }
    ];

    for (const data of meetupsData) {
      const organizerId = organizerMap[data.organizerName];
      const newMeetup = await Meetup.create({
        title: data.title,
        description: data.description,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        venue: data.venue,
        capacity: data.capacity,
        registrationDeadline: data.registrationDeadline,
        organizer: organizerId,
        status: data.status
      });

      for (let r = 0; r < data.registeredCount; r++) {
        const attendee = attendees[r];
        const isCheckedIn = r < data.checkedInCount;
        await Registration.create({
          user: attendee._id,
          meetup: newMeetup._id,
          whyAttend: 'I am highly interested in this topic and would love to participate in the activities.',
          whatLearn: 'Hoping to gain practical insights, learn best practices, and level up my understanding.',
          whatContribute: 'I can participate actively, share my feedback, and network with other attendees.',
          status: isCheckedIn ? 'checked-in' : 'registered',
          checkedInAt: isCheckedIn ? new Date() : null
        });
      }
    }
    // --- End of Meetups Seeding ---

    console.log('Database Seeding Completed Successfully!');
    console.log('Admin account: admin@peruenti.com / admin123');
    console.log('Alice account: alice@peruenti.com / password123');
    console.log('Bob account: bob@peruenti.com / password123');
    console.log('Clara account: clara@peruenti.com / password123');
    console.log('David account: david@peruenti.com / password123');
    console.log('Emily account: emily@peruenti.com / password123');
    console.log('Marcus account: marcus@peruenti.com / password123');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

run();
