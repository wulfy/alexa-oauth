
<!DOCTYPE html>
<html lang="en">
<head>
  <link rel="icon" href="/favicon.png">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>alhau - Alexa Home Automation</title>

  <!-- CSS  -->
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0-rc.2/css/materialize.min.css" type="text/css" rel="stylesheet" media="screen,projection"/>
  <style type="text/css">
    /* Custom Stylesheet */
    /**
     * Use this file to override Materialize files so you can update
     * the core Materialize files in the future
     *
     * Made By MaterializeCSS.com
     */

    nav ul a,
    nav .brand-logo {
      color: #444;
    }

    p {
      line-height: 2rem;
    }

    .sidenav-trigger {
      color: #26a69a;
    }

    .parallax-container {
      min-height: 50vh;
      line-height: 0;
      height: auto;
      color: rgba(255,255,255,.9);
    }
      .parallax-container .section {
        width: 100%;
      }

    @media only screen and (max-width : 992px) {
      .parallax-container .section {
        position: absolute;
        top: 40%;
      }
      #index-banner .section {
        top: 10%;
      }
    }

    @media only screen and (max-width : 600px) {
      #index-banner .section {
        top: 0;
      }
    }

    .icon-block {
      padding: 0 15px;
    }
    .icon-block .material-icons {
      font-size: inherit;
    }

    footer.page-footer {
      margin: 0;
    }
  </style>
</head>
<body>
  <nav class="white" role="navigation">
    <div class="nav-wrapper container">
      <a id="logo-container" href="/" class="brand-logo"><img src="/logo"></a>
      <ul class="right hide-on-med-and-down">
        <li><a href="/login">Login</a></li>
        <li><a href="/register">Register</a></li>
        <li><a href="http://alhau.free-bb.fr">Forum/Help</a></li>
      </ul>

      <ul id="nav-mobile" class="sidenav">
        <li><a href="/login">Login</a></li>
        <li><a href="/register">Register</a></li>
        <li><a target="_blank" href="http://alhau.free-bb.fr">Forum/Help</a></li>
      </ul>
      <a href="#" data-target="nav-mobile" class="sidenav-trigger"><i class="material-icons">menu</i></a>
    </div>
  </nav>

  <div class="container">
    <div class="section">
      
      TODO SECURITY
    </div>
  </div>



  <footer class="page-footer teal">
    <div class="container">
      <div class="row">
        <div class="col l6 s12">
          <h5 class="white-text">Company Bio</h5>
          <p class="grey-text text-lighten-4">We are a team of happy developpers who work on tools we dream of and provide them to anyone who need to. Our main goal is to share our knowledge and do incredible things with anyone helps!</p>


        </div>
        <div class="col l3 s12">
          <h5 class="white-text">Get Started</h5>
          <ul>
            <li><a class="white-text" href="/getStarted">Get started</a></li>
            <li><a class="white-text" href="http://www.domoticz.com/">Domoticz</a></li>
            <li><a class="white-text" target="_blank" href="http://alhau.free-bb.fr">Need help?</a></li>
          </ul>
        </div>
        <div class="col l3 s12">
          <h5 class="white-text">About us</h5>
          <ul>
            <li><a class="white-text" href="/security">Security</a></li>
            <li><a class="white-text" href="/team">The team</a></li>
            <li><a class="white-text" href="#!">Help us</a></li>
          </ul>
        </div>
      </div>
    </div>
    <div class="footer-copyright">
      <div class="container">
      Made by <a class="brown-text text-lighten-3" href="http://materializecss.com">Materialize</a>
      </div>
    </div>
  </footer>


  <!--  Scripts-->
  <script src="https://code.jquery.com/jquery-2.1.1.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0-rc.2/js/materialize.min.js"></script>
  <script>
    (function($){
      $(function(){

        $('.sidenav').sidenav();
        $('.parallax').parallax();

      }); // end of document ready
    })(jQuery); // end of jQuery name space
  </script>

  </body>
</html>                     