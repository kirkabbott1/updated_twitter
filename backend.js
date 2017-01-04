const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bluebird = require("bluebird");
const _ = require("lodash");
const bodyParser = require("body-parser");
// Generate a v4 UUID (random)
const uuidV4 = require('uuid/v4');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';

mongoose.Promise = bluebird;

mongoose.connect("mongodb://localhost/twitter_clone");
mongoose.set("debug", true);

app.use(express.static("public"));
app.use(bodyParser.json());

const User = mongoose.model('User', {
  _id: String, // actually the username
  name: String,
  password: String,
  auth_token: String,
  avatar_url: String,
  following: [String]
  // followers: [ObjectId]  // do not need it for now
});

const Tweet = mongoose.model('Tweet', {
  text: String,
  date: Date,
  userID: String,
  name: String,
  avatar_url: String,
});

// var firstTweet = new Tweet( {
//   text: "this is the first ever tweet in history",
//   date: new Date(),
//   userID: "Tom"
// });

// var secondTweet = new Tweet( {
//   text: "this is the second ever tweet in history",
//   date: new Date(),
//   userID: "IAmAnything"
// });
// var hulkTweet2 = new Tweet( {
//   text: "this is the hulksters second tweet",
//   date: new Date(),
//   userID: "Hulkster"
// });
// hulkTweet2.save()
//   .then(function(blah) {
//     console.log('hulk tweet success', blah);
//   })
//   .catch(function(err) {
//     console.log('hulkster fail', err.stack);
//   });

// secondTweet.save()
//   .then(function(blah) {
//     console.log('second tweet success', blah);
//   })
//   .catch(function(err) {
//     console.log('fail2', err.stack);
//   });
// var tomCruise = new User({
//   _id: "Tom",
//   name: "Tom Cruise"
// });
//
// var thirdUser = new User({
//   _id: "HulkHogan",
//   name: "Hulkster"
// });
// //
// thirdUser.save()
//   .then(function(result) {
//     console.log("Save success3", result);
//   })
//   .catch(function(error) {
//     console.log("Didn't save3 because: ", error.stack);
//     // console.log("Detailed information : ", error.errors);
//   });
//
// anything.save()
//   .then(function(result) {
//     console.log("Save success", result);
//   })
//   .catch(function(error) {
//     console.log("Didn't save because: ", error.stack);
//     console.log("Didn't save because: ", error.message);
//     // console.log("Detailed information : ", error.errors);
//   });
//
// console.log("Something happened again");
// console.log("print anything", anything);

// World Timeline
// Tweet.find().limit(20)
//   .then(function(stuff) {
//     console.log('did a find thing', stuff);
//   })
//   .catch(function(err) {
//     console.log('bigtime fail', err.stack);
//   });

//
// // User Profile page
app.get("/profile/:userID", function(request, response) {
  let userID = request.params.userID;
  console.log("I'm in the backend");
  console.log("request params userID", userID);

  return bluebird.all([
    Tweet.find({ userID: userID }).limit(20),
    User.findById(userID)
  ])
  .spread(function(tweets, user) {
    var profile_page = {
      tweets: tweets,
      user: user
    };
    console.log('profile info is: ', profile_page);
    // console.log("This is the response: ", response);

    response.json({
      profile_page: profile_page
    });
    // console.log('tweets information: ',tweets);
    // console.log('\nuser information:', user);
  })
  .catch(function(error) {
    response.status(400);
    response.json({
      message: "It didn't work!",
    });
    console.log("We got an error! ", error.stack);
  });
});



app.get("/my_timeline/:userID", function(request, response) {
  // My timeline
  let userID = request.params.userID;
  console.log("I'm in the my_timeline/:userID");
  console.log("request params userID", userID);

  // Finds a specific user and returns a promise
  User.findById(userID)
    .then(function(user) {
      // console.log("\nUser's info\n", user);
      // Looks at all the tweets and will return the tweets for everyone the user is following, including his/her tweets
      return Tweet.find({
        userID: {
          $in: user.following.concat([user._id])
        }
      });
    })
    // Receives all the tweets previously returned
    .then(function(tweets) {
      // console.log("User info: ", user);
      // Creates an array that will hold the userIDs of everyone the user is following (based on the information found in the tweets)
      var following = [];
      tweets.forEach(function(tweet) {
        // console.log("\n\nTweet inside tweets: \n", tweet);
        following.push(tweet.userID);
      });
      // Removes duplicate values from the following array
      following = _.uniqBy(following);
      console.log("\nI'm following: ", following);
      console.log("\n\n");
      // Gets the user information only for the users found in the following array
      return User.find({
        _id: {
          $in: following
        }
      })
      // Receives the information for all the users previously returned (only the ones the user is following)
      .then(function(following_users) {
        // Creates an indexed object
        var indexed_following_users = {};
        // Loops through every user that was previously returned (inside following_users) and creates a new object with the key value equal to the information found in user._id (the user's id inside mongodb)
        following_users.forEach(function(user) {
          indexed_following_users[user._id] = user;
          // console.log("\n\nindexed_following_users information: \n\n", indexed_following_users);
        });
        // Loops through every tweet
        tweets.forEach(function(tweet) {
          // console.log("\n\nHERE IS MY TWEET\n\n", tweet);
          // Creates a variable called user and assigns the user whose key value (from the indexed_following_users object) equals tweet.UserID
          let user = indexed_following_users[tweet.userID];
          // console.log(user);
          tweet.name = user.name;
          tweet.avatar_url = user.avatar_url;
        });
        var my_timeline_info = {
          following_users: following_users,
          my_timeline_tweets: tweets
        };
        // console.log("\n\nmy_timeline_info\n\n", my_timeline_info);
        console.log('begining admission for timeline');
        response.json({
          my_timeline_info: my_timeline_info
        });
      })
      .catch(function(error) {
        response.status(400);
        response.json({
          message: "It didn't work!",
        });
        console.log("We got an error! ", error.stack);
      });
    });
});

app.get("/world", function(request, response) {
  console.log("I'm at the beginning of the /world backend");
  // My timeline
  Tweet.find()
    .then(function(tweets) {
      console.log("world", tweets);
      // console.log("User info: ", user);
      var allUsers = [];
      tweets.forEach(function(tweet) {
        // console.log("\n\nTweet inside tweets: \n", tweet);
        allUsers.push(tweet.userID);
      });
      console.log('allusers', allUsers);
      allUsers = _.uniqBy(allUsers);
      console.log("\nI'm allUsers: ", allUsers);
      console.log("\n\n");
        return User.find({
          _id: {
            $in: allUsers
          }
        })
        .then(function(users) {
          console.log('success users from allUsers that tweet', users);
          var indexed_users = {};
            users.forEach(function(user) {
              indexed_users[user._id] = user;
              console.log("\n\nindexed_users information: \n\n", indexed_users);
            });
            tweets.forEach(function(tweet) {
              console.log("\n\nHERE IS MY TWEET\n\n", tweet);
              let user = indexed_users[tweet.userID];
              // console.log(user);
              tweet.name = user.name;
              tweet.avatar_url = user.avatar_url;
            });
            var world_timeline_info = {
              world_tweets: tweets
            };
            console.log("\n\nworld_timeline_info\n\n", world_timeline_info);
            response.json({
              world_timeline_info: world_timeline_info
            });
        })
        .catch(function(error) {
          response.status(400);
          response.json({
            message: "It didn't work!",
          });
          console.log("We got an error world! ", error.stack);
        });
    });
});
app.post("/profile", function(request, response) {
  console.log("This is the request: ", request.body);
  var followingID = request.body['followingID'];
  var userID = request.body['user_ID'];
  console.log("This is the request followingID: ", followingID);
  console.log("This is the request userID: ", userID);
  User.update(
    { _id: userID },
    {
      $addToSet: {
        following: followingID
      }
    }
  ).then(function() {
    console.log('success following')
  })

});

app.post("/my_timeline", function(request, response) {
  console.log(request.body);
  var tweet_retweet = request.body.tweet_retweet;
  console.log("I'm goint to do something: ", tweet_retweet);

  if (tweet_retweet === "retweet") {
    console.log("I'm trying to retweet!!!");
    console.log("This is the request for the retweet: ", request.body);
    var userID = request.body.user_ID;
    var retweetingID = request.body.retweetingID;
    var tweet_text = request.body.tweet;
    var retweet_from = userID + " retweeted from " + retweetingID + ": ";
    var post = retweet_from + tweet_text;
    var token = request.body.token;
    console.log(userID);
    console.log(retweetingID);
    console.log(tweet_text);
    console.log(post);
    console.log("token", token);

    if (token) {
      var newTweetPost = new Tweet( {
        text: post,
        date: new Date(),
        userID: userID
      });

      newTweetPost.save()
        .then(function(tweet_posted) {
           console.log('tweet tweet success', tweet_posted);
           response.json({
             tweet: tweet_posted
           });
         })
        .catch(function(err) {
         console.log('tweet tweet fail', err.stack);
        });
    }
  }

  if (tweet_retweet === "tweet") {
    console.log("This is the request: ", request.body);
    var username = request.body.tweetInfo['userID'];
    var token = request.body.tweetInfo['token'];
    var post = request.body.tweetInfo['post'];
    console.log("username", username);
    console.log("token", token);
    console.log("post", post);

    if (token) {
      var newTweetPost = new Tweet( {
        text: post,
        date: new Date(),
        userID: username
      });

      newTweetPost.save()
        .then(function(blah) {
           console.log('tweet tweet success', blah);
           response.json({
             tweet: blah
           });
         })
        .catch(function(err) {
         console.log('tweet tweet fail', err.stack);
        });
    }
  }
});

  app.post('/signup', function(request, response) {
    console.log("This is the request: ", request.body);
    var name = request.body['name'];
    var username = request.body['username'];
    var password = request.body['password'];

    bcrypt.hash(password, saltRounds)
      .then(function(hash) {
        console.log("This is the hash: ", hash);
        var newSignup = new User({
          name: name,
          _id: username,
          password: hash
        });

        console.log("This is the newSignup info: ", newSignup);

        newSignup.save()
          .then(function(result) {
            console.log("Save success", result);
          })
          .catch(function(error) {
            console.log("Didn't save because: ", error.stack);
          });
      })
      .catch(function(error) {
        console.log("Didn't save because: ", error.stack);
       });
});

app.post('/login', function(request, response) {
  console.log("This is the request: ", request.body);
  var username = request.body['username'];
  var verify_password = request.body['password'];
  console.log("Username: ", username);
  console.log("verify_password: ", verify_password);

  User.findById(username)
    .then(function(user) {
      var user_id = user._id;
      console.log("User returned from the database: ", user);
      let hash = user.password;
      console.log("This is the password/hash", hash);
      // Load hash from your password DB.
      bcrypt.compare(verify_password, hash)
        .then(function(response) {
          if (response) {
            console.log("You are allowed to enter because response is: ", response);
            var auth_token = uuidV4();
            console.log("This is my special token.  Don't touch: ", auth_token);
            return bluebird.all([
              auth_token,
              user_id,
              User.update(
                { _id: username },
                {
                  $set: {
                    auth_token: auth_token
                  }
                }
              )
            ]);
          } else {
            throw new Error("You are NOT allowed to enter");
          }
        })
        .then(function(stuff) {
          let auth_token = stuff[0];
          let user_id = stuff[1];
          console.log("This is my stuff: ", stuff);
          console.log("success @!!@");
          console.log("Here is the user's token!", auth_token);
          response.json({
            auth_token: auth_token,
            user_id: user_id
          });
        })
        .catch(function(error) {
          console.log("You have an error: ", error.stack);
        })
        ;
    });
});



app.listen(3000, function() {
  console.log("Hello!  Serving y'all from 3000 road");
});
