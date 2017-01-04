// Will be the front end (somehow)

var app = angular.module("twitter_clone", ["ui.router", "ngCookies"]);

// app.run(function($rootScope, $cookies) {
//   console.log("I like to run\n\n\n\n");
  // cookie data gets passed into the factory
  // $rootScope.factory_cookie_data = $cookies.getObject('cookieData');
  // console.log("I have a cookie.  Do you want to see it? ", $rootScope.factory_cookie_data);
  // $rootScope.userID = $rootScope.factory_cookie_data.user_id;
// });

app.factory("twitterFactory", function($http, $rootScope, $cookies, $state) {
  var service = {};
  // $rootScope.factory_cookie_data = null;
  // console.log("Printing initial cookie", $rootScope.factory_cookie_data);
  // $rootScope.factory_cookie_data = $cookies.getObject('cookieData');

  // console.log("Printing initial cookie", $rootScope.factory_cookie_data);

  $rootScope.factory_cookie_data = $cookies.getObject('cookieData');
  // console.log("I have a cookie.  Do you want to see it? ", $rootScope.factory_cookie_data);

  // console.log("I am inside the factory!");
  if ($rootScope.factory_cookie_data) {
    // console.log("I am a cookie data in the factory!");
    // grab auth_token from the cookieData
    $rootScope.authToken = $rootScope.factory_cookie_data.auth_token;
    // // grab user information from cookieData
    $rootScope.userID = $rootScope.factory_cookie_data.user_id;
  }


  // store user information in a $rootScope variable
  // $rootScope.userID = user_info.user_id;
  // store token information in a $rootScope variable
  // $rootScope.authToken = user_info.auth_token;

  $rootScope.logout = function() {
    // console.log("Entered the logout function");
    // remove method => pass in the value of the cookie data you want to remove
    $cookies.remove('cookieData');
    // reset all the scope variables
    $rootScope.factory_cookie_data = null;
    $rootScope.authToken = null;
    $rootScope.userID = null;
    // console.log("Here is the $rootScope.authToken: ", $rootScope.authToken);
    $state.go("world");
  };

  service.profile = function(userID) {
    return $http ({
      method: "GET",
      url: "/profile/" + userID
    });
  };

  service.followUser = function(userID) {
    return $http ({
      method: "POST",
      url: "/profile",
      data: {
        followingID: userID,
        user_ID: $rootScope.userID
      }
    });
  };

  service.tweet = function(tweetInfo) {
    var tweet = "tweet";
    console.log("I'm tweeting from the factory!!!", tweetInfo);
    return $http ({
      method: "POST",
      url: "/my_timeline",
      data: {
        tweet_retweet: tweet,
        tweetInfo: tweetInfo
      }
    });
  };

  service.retweeting = function(userID, tweet_text) {
    var retweet = "retweet";
    return $http ({
      method: "POST",
      url: "/my_timeline",
      data: {
        tweet_retweet: retweet,
        retweetingID: userID,
        tweet: tweet_text,
        user_ID: $rootScope.userID,
        token: $rootScope.authToken
      }
    });
  };

  service.myTimeline = function(userID) {
    // console.log("I'm inside the myTimeline factory");
    return $http ({
      method: "GET",
      url: "/my_timeline/" + userID
    });
  };

  service.world = function() {
    // console.log("inside world factory service");
    return $http ({
      method: "GET",
      url: "/world"
    });
  };

  service.signup = function(data) {
    // console.log("in signup service", data);
    return $http ({
      method: 'POST',
      url: "/signup",
      data: data
    });
  };
  service.login = function(data) {
    // console.log("in login service", data);
    return $http ({
      method: 'POST',
      url: "/login",
      data: data
    });
  };



  return service;
});


app.controller("ProfileController", function($scope, twitterFactory, $stateParams) {
  // console.log("I got into the controller.  Yay!!!");
  var userID = $stateParams.username;
  console.log("This is the userID inside the ProfileController", userID);
  twitterFactory.profile(userID)
    .then(function(info) {
      // console.log("Profile info received in the ProfileController", info);
      $scope.profile = info.data.profile_page.user;
      $scope.tweets = info.data.profile_page.tweets;
    })
    .catch(function(error) {
      console.log("There was an error!!!", error.stack);
    });
  $scope.follow = function() {
    var userID = $stateParams.username;
    console.log("in scope follow click func", userID);
    twitterFactory.followUser(userID);
  };
});

app.controller("MyTimelineController", function($scope, twitterFactory, $rootScope, $state, $stateParams) {
  var userID;
  console.log("Here are parameters.  Don't cross them!", $stateParams);
  // Need to have this if statement in place because our home url state is defined as /home/{username}.  Without a username, we won't be able to see anything in the home page.
  if ($stateParams) {
    userID = $rootScope.userID;
  } else {
    userID = $stateParams.username;
  }
  console.log("This is the userID", userID);

  console.log("we're in the timeline controller");
  twitterFactory.myTimeline(userID)
    .then(function(info) {
      // console.log("mytimeline info", info);
      $scope.tweets = info.data.my_timeline_info.my_timeline_tweets;
      $scope.following = info.data.my_timeline_info.following_users;
    })
    .catch(function(error) {
      console.log("There was an error!!!", error.stack);
    });

  $scope.postTweet = function() {
    var tweetInfoSendFactory = {
      token: $rootScope.authToken,
      userID: $rootScope.userID,
      post: $scope.post
    };
    twitterFactory.tweet(tweetInfoSendFactory)
    .then(function(response) {
      console.log("tweetInfoSendFactory ", response.data);
      console.log('arrived from TWEET!');
       $scope.post = "";
       $state.reload();
    })
    .catch(function(error) {
      console.log("There was an error!!!", error.stack);
    });
  };

  $scope.retweet = function(user, tweet_text) {
    console.log("I'm retweeting this sh!7", user);
    console.log("I'm retweeting this sh!7", tweet_text);
    twitterFactory.retweeting(user, tweet_text)
    .then(function(response) {
      $state.reload();
    })
    .catch(function(error) {
      console.log("There was an error!!!", error.stack);
    });
  };
});

app.controller("WorldController", function($scope, twitterFactory) {
  console.log("we're in the world controller");
  twitterFactory.world()
  .then(function(info) {
    // console.log("world info", info);
    $scope.allTweets = info.data.world_timeline_info.world_tweets;
  })
  .catch(function(error) {
    console.log("There was an error!!!", error.stack);
  });
});

app.controller("SignupController", function($scope, twitterFactory, $state) {
  // console.log("in signup");

  $scope.signup = function() {
    // console.log('in signupfunction');
    $scope.signup_data = {
      name: $scope.name,
      username: $scope.username,
      password: $scope.password
    };
    // console.log("$scope.signup_data is ", $scope.signup_data);
    twitterFactory.signup($scope.signup_data);
    $state.go('login');
  };
});
app.controller("LoginController", function($scope, twitterFactory, $cookies, $state, $rootScope) {
  // console.log("in login");

  $scope.login = function() {
    // console.log('in login function');
    $scope.login_data = {
      username: $scope.username,
      password: $scope.password
    };
    // console.log("$scope.login_data is ", $scope.login_data);
    twitterFactory.login($scope.login_data)
      .then(function(response) {
        // console.log("This response is coming from the backend: ", response.data);
        // console.log("This is the response info: ", response);
        var auth_token = response.data.auth_token;
        var user_id = response.data.user_id;
        var user_info = {
          auth_token: auth_token,
          user_id: user_id
        };
        // console.log("\n\n\nI'm a cute token: ", auth_token);
        // console.log("But I own the token...", user_id);

        // console.log("I put the dough in the cookie....");
        $cookies.putObject('cookieData', user_info);
        // store user information in a $rootScope variable
        // Need this information as the factory will not store the cookie until a reload happens
        $rootScope.cookie_data = user_info;
        // store user id in a $rootScope variable
        $rootScope.userID = user_info.user_id;
        // store token information in a $rootScope variable
        $rootScope.authToken = user_info.auth_token;
        // console.log("Here is my $rootScope.authToken", $rootScope.authToken);
        $state.go("home");

      })
      .catch(function(error) {
        console.log("There was an error: ", error.stack);
      });
  };
});

app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state({
    name: "home",
    url: "/home/{username}",
    templateUrl: "my_timeline.html",
    controller: "MyTimelineController"
  })
  .state({
    name: "profile",
    url: "/profile/{username}",
    templateUrl: "profile.html",
    controller: "ProfileController"
  })
  .state({
    name: "world",
    url: "/world",
    templateUrl: "world.html",
    controller: "WorldController"
  })
  .state({
    name: "signup",
    url: "/signup",
    templateUrl: "signup.html",
    controller: "SignupController"
  })
  .state({
    name: "login",
    url: "/login",
    templateUrl: "login.html",
    controller: "LoginController"
  });

  $urlRouterProvider.otherwise("/home/{username}");
});
