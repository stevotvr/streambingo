jQuery.noConflict();
(function($) {
  'use strict';

  $(function() {
    var gameVars = JSON.parse($('#game-vars').text());

    var socket = io('//' + window.location.hostname + ':3000');

    var bingoBall = $('.bingo-ball');

    socket.on('connect', function() {
      socket.emit('getgame', gameVars.gameToken, function(gameName) {
        console.log('joined game ' + gameName);
        $('#connection-status span').text('Connected');
      });
    });

    socket.on('disconnect', function() {
      console.log('socket connection lost');
      $('#connection-status span').text('Disconnected');
    });

    socket.on('numbercalled', function(letter, number) {
      $('.latest').removeClass('latest');
      $('#board td[data-cell=' + number + ']').addClass('marked').addClass('latest');
      $('#last-number').text(letter + number);

      var ball = bingoBall.clone();
      ball.addClass(letter.toLowerCase());
      ball.find('.letter').text(letter);
      ball.find('.number').text(number);
      bingoBall.before(ball);
      ball.css('animation-play-state', 'running').find('.inner-ball').css('animation-play-state', 'running');
      setTimeout(function() {
        ball.remove();
      }, 8000);
    });

    socket.on('gameover', function(gameName, winner) {
      if (winner) {
        console.log('congrats ' + winner + '!');
      }

      $('#board td').removeClass('marked');
      $('#last-number').text('');
      $('#card-count').text('0 Players');
    });

    $('#create-game').click(function() {
      if (window.confirm('Create a new game?')) {
        var postData = {
          json: true,
          action: 'createGame'
        };
        $.post(window.location, postData, function() {
          socket.emit('resetgame');
        }, 'json');
      }
    });

    $('#call-number').click(function() {
      var postData = {
        json: true,
        action: 'callNumber'
      };
      $.post(window.location, postData, function(data) {
        socket.emit('callnumber', data.letter, data.number);
      }, 'json');
    });

    $('#source-url').click(function() {
      $(this).select();
    });

    $('#copy-source-url').click(function() {
      $('#source-url').select();
      document.execCommand('copy');
    });

    setInterval(function() {
      var postData = {
        json: true,
        action: 'getStats'
      };
      $.post(window.location, postData, function(data) {
        $('#card-count').text(data.cardCount);
      }, 'json');
    }, 10000);
  });
})(jQuery);
