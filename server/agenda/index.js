const Agenda = require('agenda');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { ObjectId } = require('mongodb');

const sendEmail = (to, subject, text) => new Promise(resolve => {
  const transporter = nodemailer.createTransport({ sendmail: true });

  const mailOptions = {
    from: `"${process.env.TITLE}" <${process.env.FROM_EMAIL_ADDRESS}>`,
    to, // (comma separated)
    subject,
    text, // plain text body
    // html, // html body
    // attachments,
  };

  // console.log({ mailOptions });

  // transporter.sendMail(mailOptions, (err, info) => {
  transporter.sendMail(mailOptions, err => {
    // if (err) reject(err);
    // if (info) resolve(info);
    if (err) console.log('err:', err);
    // console.log('info:', info);
    // console.log('\t\t\tSent:', to);
    resolve();
  });
});

module.exports = async app => {
  const emailError = async (id, error) => {
    let text = '';
    if (error.stack) text += `${error.stack} \n\n`;
    if (
      error.odbcErrors &&
      Array.isArray(error.odbcErrors) &&
      error.odbcErrors.length
    ) {
      error.odbcErrors.forEach((e, index) => {
        try {
          if (e.message) text += `${e.message} \n\n`;
          if (!e.message) text += `${JSON.stringify(e)} \n\n`;
        } catch (err) {
          console.log(`Failed to add odbcError ${index + 1} of ${error.odbcErrors.length} to error email`);
        }
      });
    }

    let subject = 'Report ';
    try {
      const def = await app.dbo.collection('definitions').findOne({ _id: ObjectId(id) }, { name: 1 });
      subject += `"${def.name}"`;
    } catch (err) {
      console.error(err);
      subject += `${id}`;
    } finally {
      subject += ' failed';
    }

    await sendEmail(process.env.ADMIN_EMAIL_ADDRESS, subject, text);
  };

  const agenda = new Agenda({ mongo: app.dbo });
  app.agenda = agenda;

  console.log('start loading jobs');
  await fs.readdirSync('./server/agenda/jobs')
    // use _ to exclude a file from jobs
    .filter(filename => filename.endsWith('.js') && !filename.startsWith('_'))
    .reduce(async (prevPromise, filename) => {
      await prevPromise;
      // eslint-disable-next-line global-require, import/no-dynamic-require
      await require(`./jobs/${filename}`)(filename.replace('.js', ''), app);
    }, Promise.resolve());
  console.log('done loading jobs');

  // agenda.define('attrs', job => {
  //   console.log({ attrs: job.attrs });
  //   console.log({ thisWillFail: job.trees.roots });
  // });
  // agenda.every('5 seconds', 'attrs');

  // console.log('got to every');
  // agenda.every('*/1 * * * *', 'autoAssign');

  // agenda.every(
  //   '2 minutes',
  //   'demoJob',
  //   { name: 'this is parameter name', now: new Date() },
  //   // { skipImmediate: true },
  // );
  // agenda.every(
  //   '*/1 * * * *',
  //   // '*/5 5-21 * * *',
  //   'demoJob',
  //   { reportId: 'dfg654asdg654' },
  //   // { skipImmediate: true },
  // );

  // agenda.create('demoJob', { reportId: '3' }).repeatEvery('*/2 * * * *').save();
  // agenda.create('demoJob', { reportId: '30 sec' }).repeatEvery('30 seconds').save();

  // dbo.collection('administerClaimCueCardSchedule').findOne(
  //   { current: true },
  //   (err, schedule) => {
  //     if (err) { console.error(err); return; }
  //     agenda.every(schedule.schedule, 'Administer Claim Cue Card');
  //   },
  // );

  agenda.purge()
    .then(numRemoved => {
      if (numRemoved) console.log(`Agenda purged ${numRemoved} jobs`);
    })
    .catch(err => console.error(err));

  // agenda.now(
  //   'testAgenda',
  //   { name: 'now test', now: new Date() },
  // );

  agenda.on('start', job => {
    console.log(`Starting job: ${job.attrs.name}`);
  });
  // agenda.on('complete', job => {
  //   console.log(`Completed job: ${job.attrs.name}`);
  // });
  agenda.on('success', job => {
    console.log(`Successfully completed job: ${job.attrs.name}`);
  });
  agenda.on('fail', (err, job) => {
    console.log(`Job "${job.attrs.name}" failed with error: ${err.message}`);
    emailError(job.attrs.name, err);
  });

  console.log('Starting Agenda');
  agenda.start();
};
