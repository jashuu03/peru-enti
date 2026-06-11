const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const Meetup = require('./models/Meetup');
const User = require('./models/User');
const Registration = require('./models/Registration');

const run = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Database connected!');

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // 1. Create or Find Organizers
    console.log('Setting up organizer profiles...');
    const organizers = [
      { name: 'Coding Club', email: 'codingclub@peruenti.com', profession: 'Official Student Club' },
      { name: 'Entrepreneurship Cell', email: 'ecell@peruenti.com', profession: 'Incubator & Cell' },
      { name: 'Tech Society', email: 'techsociety@peruenti.com', profession: 'Technical Society' },
      { name: 'AI Club', email: 'aiclub@peruenti.com', profession: 'Artificial Intelligence Club' },
      { name: 'Developer Community', email: 'devcomm@peruenti.com', profession: 'Developer Community' }
    ];

    const organizerMap = {};
    for (const org of organizers) {
      let userObj = await User.findOne({ email: org.email });
      if (!userObj) {
        userObj = await User.create({
          name: org.name,
          email: org.email,
          password: hashedPassword,
          profession: org.profession,
          company: 'Peru Enti',
          lookingFor: ['Organizing Events', 'Sponsorships'],
          role: 'admin',
          isOnline: false
        });
        console.log(`Created organizer: ${org.name}`);
      } else {
        organizerMap[org.name] = userObj._id;
      }
      organizerMap[org.name] = userObj._id;
    }

    // 2. Create or Find Attendee Dummy Users (need at least 78)
    console.log('Checking and seeding attendee pool...');
    const attendees = [];
    for (let i = 1; i <= 80; i++) {
      const email = `attendee${i}@peruenti.com`;
      let attendee = await User.findOne({ email });
      if (!attendee) {
        attendee = await User.create({
          name: `Attendee ${i}`,
          email: email,
          password: hashedPassword,
          profession: i % 2 === 0 ? 'Software Engineer' : 'Product Designer',
          company: i % 3 === 0 ? 'Tech Corp' : (i % 3 === 1 ? 'Design Studio' : 'Freelance'),
          lookingFor: ['Networking', 'Learning new skills'],
          role: 'user',
          isOnline: false
        });
      }
      attendees.push(attendee);
    }
    console.log(`Attendee pool ready. Total attendees in pool: ${attendees.length}`);

    // 3. Meetups Data Definitions
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

    const meetupTitles = meetupsData.map(m => m.title);

    // 4. Delete old instances to ensure idempotence
    console.log('Cleaning up existing meetups with same titles...');
    const oldMeetups = await Meetup.find({ title: { $in: meetupTitles } });
    const oldMeetupIds = oldMeetups.map(m => m._id);
    await Registration.deleteMany({ meetup: { $in: oldMeetupIds } });
    await Meetup.deleteMany({ title: { $in: meetupTitles } });
    console.log('Old records cleaned.');

    // 5. Create Meetups and registrations
    for (const data of meetupsData) {
      const organizerId = organizerMap[data.organizerName];
      if (!organizerId) {
        console.error(`Organizer not found: ${data.organizerName}`);
        continue;
      }

      console.log(`Creating meetup: ${data.title}...`);
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

      console.log(`Meetup created with ID: ${newMeetup._id}`);

      // Seed registrations
      console.log(`Registering ${data.registeredCount} members...`);
      for (let r = 0; r < data.registeredCount; r++) {
        const attendee = attendees[r];
        // Decide status (registered vs checked-in)
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
      console.log(`Successfully set registrations for ${data.title}.`);
    }

    console.log('Meetups injection completed successfully!');
  } catch (error) {
    console.error('Error seeding meetups:', error);
  } finally {
    mongoose.connection.close();
  }
};

run();
