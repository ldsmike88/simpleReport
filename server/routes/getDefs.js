const mongodb = require('mongodb');

module.exports = app => app.get(app.routeFromName(__filename), async (req, res) => {
  try {
    const query = [
      {
        $match: {
          deleted: { $ne: true },
        },
      },
      {
        $project: {
          parentId: 1,
          name: 1,
          description: 1,
        },
      },
      {
        $sort: {
          // dept: 1,
          name: 1,
        },
      },
      {
        $lookup: {
          from: 'users',
          let: {
            report_id: '$_id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$_id', mongodb.ObjectId(req.session.userid)],
                    },
                    {
                      $in: ['$$report_id', '$subscriptions'],
                    },
                  ],
                },
              },
            },
          ],
          as: 'subscribed',
        },
      },
      {
        $lookup: {
          from: 'users',
          let: {
            report_id: '$_id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$_id', mongodb.ObjectId(req.session.userid)],
                    },
                    {
                      $in: ['$$report_id', '$notifications'],
                    },
                  ],
                },
              },
            },
          ],
          as: 'notify',
        },
      },
      {
        $lookup: {
          from: 'users',
          let: {
            report_id: '$_id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$_id', mongodb.ObjectId(req.session.userid)],
                    },
                    {
                      $in: ['$$report_id', '$starred'],
                    },
                  ],
                },
              },
            },
          ],
          as: 'starred',
        },
      },
      {
        $lookup: {
          from: 'reports',
          let: {
            definitionId: '$_id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$definitionId', '$$definitionId'],
                    },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
              },
            },
          ],
          as: 'lastRun',
        },
      },
      {
        $addFields: {
          subscribed: {
            $size: '$subscribed',
          },
          notify: {
            $size: '$notify',
          },
          starred: {
            $size: '$starred',
          },
          lastRun: {
            $toDate: {
              $max: '$lastRun._id',
            },
          },
        },
      },
    ];

    const docs = await req.app.dbo.collection('definitions').aggregate(query).toArray();
    // const folders = await req.app.dbo.collection('folders').find().toArray();
    // res.apiRes([...docs, ...folders.map(f => ({ ...f, isFolder: true }))]);
    res.apiRes(docs);
  } catch (err) {
    console.error(err);
    res.status(500).success(false).messages([err.message]).apiRes([]);
  }
});
