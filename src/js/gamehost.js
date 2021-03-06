/**
 * This file is part of StreamBingo.
 *
 * @copyright (c) 2020, Steve Guidetti, https://github.com/stevotvr
 * @license GNU General Public License, version 3 (GPL-3.0)
 *
 * For full license information, see the LICENSE file included with the source.
 */

'use strict';

$(function() {
  $('body').removeClass('nojs');

  var gameVars = JSON.parse($('#game-vars').text());

  var connected = false;

  var autoCallTimer;
  var autoRestartTimer;
  var autoRestartCountdown;
  var autoEndTimer;
  var autoEndCountdown;
  var settingsUpdateTimer;

  var calledNumbers = [];

  $('#auto-call').prop('checked', window.sessionStorage.getItem('autoCall') === 'true');
  $('#auto-restart').prop('checked', window.sessionStorage.getItem('autoRestart') === 'true');
  $('#auto-end').prop('checked', window.sessionStorage.getItem('autoEnd') === 'true');

  var gameType = window.sessionStorage.getItem('gameType');
  $('#create-game-type').val(gameType ? gameType : 0);

  var socket = io('//' + window.location.hostname + ':3000');

  socket.on('connect', function() {
    socket.emit('getgame', gameVars.gameToken, function(gameName, settings, called, ended, winner) {
      console.log('joined game ' + gameName);

      connected = true;

      $('#connection-status span').text('Connected');

      gameVars.tts = settings.tts;
      gameVars.ttsVoice = settings.ttsVoice;
      gameVars.ended = ended;
      gameVars.winner = winner;

      calledNumbers = called;

      $('#board .marked').removeClass('marked').removeClass('latest');
      if (called.length) {
        for (var i = 0; i < called.length; i++) {
          var cell = $('#board td[data-cell=' + called[i] + ']');
          cell.addClass('marked');

          if (called.length - i <= 5) {
            cell.addClass('recent');
          }
        }

        var latest = called[called.length - 1];
        $('#board td[data-cell=' + latest + ']').removeClass('recent').addClass('latest');
        $('#last-number').text(getLetter(latest) + latest);
      }

      updateGameState();
      updateAutoCall();
      updateAutoRestart();
      updateAutoEnd();

      $('#create-game').prop('disabled', false);
    });
  });

  socket.on('disconnect', function() {
    console.warn('socket connection lost');

    connected = false;

    $('#connection-status span').text('Disconnected');
    $('#call-number').prop('disabled', true);
    $('#create-game').prop('disabled', true);

    clearTimers();
  });

  socket.on('numbercalled', function(number) {
    var letter = getLetter(number);
    console.log('called ' + letter + number);

    calledNumbers.push(number);

    $('.latest').removeClass('latest').addClass('recent');
    $('#board td[data-cell=' + number + ']').addClass('marked').addClass('latest');
    $('#last-number').text(letter + number);

    if (calledNumbers.length >= 5) {
      $('#board td[data-cell=' + calledNumbers[calledNumbers.length - 6] + ']').removeClass('recent');
    }

    updateAutoEnd();
  });

  socket.on('addplayer', function () {
    gameVars.cardCount++;
    var count = gameVars.cardCount + ' ' + (gameVars.cardCount === 1 ? ' Player' : ' Players');
    $('#card-count').text(count);
  })

  socket.on('gameover', function(gameName, winner) {
    console.log('game ended');

    if (!gameVars.ended) {
      gameVars.ended = true;
      updateAutoRestart();
    }

    gameVars.winner = winner;
    updateGameState();
  });

  socket.on('resetgame', function() {
    console.log('reset game');

    $('#board td').removeClass('marked');
    $('#last-number').text('--');
    $('.game-winner').text('--');
    $('#card-count').text('0 Players');
    $('#call-number').prop('disabled', false);
    $('#create-game').prop('disabled', false);

    gameVars.ended = false;
    gameVars.winner = '';
    gameVars.cardCount = 0;
    calledNumbers = [];

    clearTimers();
    updateAutoCall();
  });

  $('#create-game').click(function() {
    $('#create-game-wrapper').removeClass('hidden');
    $('#create-game-cancel').removeClass('hidden');
  });

  $('#create-game-type').change(function() {
    window.sessionStorage.setItem('gameType', $(this).val());
  });

  $('#create-game-confirm').click(function() {
    restartGame();
    $('#create-game-wrapper').addClass('hidden');
  });

  $('#create-game-cancel').click(function() {
    $('#create-game-wrapper').addClass('hidden');
  });

  $('#call-number').click(function() {
    callNumber();
  });

  $('#auto-call').change(function() {
    updateAutoCall();
    window.sessionStorage.setItem('autoCall', $(this).prop('checked'));
  });

  $('#auto-restart').change(function () {
    updateAutoRestart();
    window.sessionStorage.setItem('autoRestart', $(this).prop('checked'));
  });

  $('#auto-end').change(function () {
    updateAutoEnd();
    window.sessionStorage.setItem('autoEnd', $(this).prop('checked'));
  });

  $('#auto-call-interval, #auto-restart-interval, #auto-end-interval').change(function() {
    updateAutoCall();
    updateAutoRestart();
    updateAutoEnd();

    if (settingsUpdateTimer) {
      clearTimeout(settingsUpdateTimer);
      settingsUpdateTimer = undefined;
    }

    settingsUpdateTimer = setTimeout(function () {
      updateGameSettings();
      settingsUpdateTimer = null;
    }, 3000);
  });

  $('#tts').change(function () {
    updateGameSettings();
  });

  $('#tts-voice').change(function () {
    updateGameSettings();
  });

  $('#background').change(function () {
    updateGameSettings();
  });

  $('#source-url').click(function() {
    $(this).select();
  });

  $('#copy-source-url').click(function() {
    $('#source-url').select();
    document.execCommand('copy');
  });

  function callNumber() {
    if (!connected || gameVars.ended || calledNumbers.length === 75) {
      return;
    }

    if (autoCallTimer) {
      clearInterval(autoCallTimer);
      autoCallTimer = undefined;
    }

    $('#call-number').prop('disabled', true);
    $('#create-game').prop('disabled', true);

    var postData = {
      json: true,
      action: 'callNumber'
    };
    $.post(window.location, postData, function() {
      $('#create-game').prop('disabled', false);
      setTimeout(function() {
        updateGameState();
      }, 8000);
      updateAutoCall();
    }, 'json');
  }

  function restartGame() {
    if (!connected) {
      return;
    }

    $('#call-number').prop('disabled', true);
    $('#create-game').prop('disabled', true);

    var postData = {
      json: true,
      action: 'createGame',
      gameType: $('#create-game-type').val()
    };
    $.post(window.location, postData);
  }

  function updateAutoCall() {
    if (autoCallTimer) {
      clearInterval(autoCallTimer);
      autoCallTimer = undefined;
    }

    if ($('#auto-call').prop('checked')) {
      autoCallTimer = setInterval(function() {
        callNumber();
      }, $('#auto-call-interval').val() * 1000);
    }
  }

  function updateAutoRestart() {
    if ($('#auto-restart').prop('checked')) {
      if (gameVars.ended && !autoRestartTimer) {
        autoRestartCountdown = $('#auto-restart-interval').val();
        autoRestartTimer = setInterval(function () {
          autoRestartCountdown--;
          if (!autoRestartCountdown) {
            clearInterval(autoRestartTimer);
            autoRestartTimer = setTimeout(function () {
              restartGame();
              autoRestartTimer = undefined;
            }, 2000);
          }
        }, 1000);

        socket.emit('timer', 'restart', true, autoRestartCountdown);
      }
    } else if (autoRestartTimer) {
      clearInterval(autoRestartTimer);
      autoRestartTimer = undefined;

      socket.emit('timer', 'restart', false);
    }
  }

  function updateAutoEnd() {
    if ($('#auto-end').prop('checked')) {
      if (calledNumbers.length === 75 && !autoEndTimer) {
        autoEndCountdown = $('#auto-end-interval').val();
        autoEndTimer = setInterval(function () {
          autoEndCountdown--;
          if (!autoEndCountdown) {
            clearInterval(autoEndTimer);
            autoEndTimer = setTimeout(function () {
              var postData = {
                json: true,
                action: 'endGame'
              };
              $.post(window.location, postData);
              autoEndTimer = undefined;
            }, 2000);
          }
        }, 1000);

        socket.emit('timer', 'end', true, autoEndCountdown);
      }
    } else if (autoEndTimer) {
      clearInterval(autoEndTimer);
      autoEndTimer = undefined;

      socket.emit('timer', 'end', false);
    }
  }

  function updateGameSettings() {
    gameVars.tts = $('#tts').prop('checked');
    gameVars.ttsVoice = $('#tts-voice').val();

    var postData = {
      json: true,
      action: 'updateGameSettings',
      autoCall: $('#auto-call-interval').val(),
      autoRestart: $('#auto-restart-interval').val(),
      autoEnd: $('#auto-end-interval').val(),
      tts: gameVars.tts,
      ttsVoice: gameVars.ttsVoice,
      background: $('#background').val()
    };
    $.post(window.location, postData);
  }

  function updateGameState() {
    if (gameVars.ended) {
      if (gameVars.winner) {
        console.log('congrats ' + gameVars.winner + '!');
        $('.game-winner').text(gameVars.winner);
      }

      $('#call-number').prop('disabled', true);
    } else {
      $('#call-number').prop('disabled', calledNumbers === 75);
    }
  }

  function clearTimers() {
    if (autoCallTimer) {
      clearInterval(autoCallTimer);
      autoCallTimer = undefined;
    }

    if (autoRestartTimer) {
      clearInterval(autoRestartTimer);
      autoRestartTimer = undefined;
    }

    if (autoEndTimer) {
      clearInterval(autoEndTimer);
      autoEndTimer = undefined;
    }
  }

  function getLetter(number) {
    if (number <= 15) {
      return 'B';
    } else if (number <= 30) {
      return 'I';
    } else if (number <= 45) {
      return 'N';
    } else if (number <= 60) {
      return 'G';
    }
    return 'O';
  }
});
