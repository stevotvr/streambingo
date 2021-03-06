<?php

/**
 * This file is part of StreamBingo.
 *
 * @copyright (c) 2020, Steve Guidetti, https://github.com/stevotvr
 * @license GNU General Public License, version 3 (GPL-3.0)
 *
 * For full license information, see the LICENSE file included with the source.
 */

?>
<?php require __DIR__ . '/../_header.php'; ?>
        <noscript>JavaScript must be enabled to use this site.</noscript>
        <p>Join our <a href="https://discord.io/StreamBingo" target="_blank">Discord server</a> or <a href="https://twitter.com/streambingolive" target="_blank">follow us on Twitter</a> to stay up to date with Stream BINGO news.</p>
        <p>Mark numbers as they are called on the stream. Click a number to mark the cell. Double-click to unmark the cell.</p>
        <div id="play">
            <div id="connection-status">Status: <span>Connecting...</span></div>
            <div id="cards">
                <p id="empty-list"<?php if (!empty($cards)): ?> class="hidden"<?php endif; ?>>You have no BINGO cards.</p>
<?php foreach ($cards as $card): ?>
                <div class="card" data-game-id="<?php echo $card['gameId']; ?>" data-game-name="<?php echo $card['gameName']; ?>">
                    <h2 class="game-name"><?php echo $card['gameName']; ?></h2>
<?php if ($card['gameType'] < 2): ?>
                    <p>Fill 5 adjacent squares in a line.</p>
<?php else: ?>
                    <p>Fill all squares.</p>
<?php endif; ?>
                    <table class="grid">
                        <tr>
                            <th class="letter-b">B</th>
                            <th class="letter-i">I</th>
                            <th class="letter-n">N</th>
                            <th class="letter-g">G</th>
                            <th class="letter-o">O</th>
                        </tr>
<?php for ($i = 0; $i < 5; $i++): ?>
                        <tr>
<?php for ($j = 0; $j <= 20; $j += 5): ?>
                            <td>
                                <div class="marker<?php if ($card['freeSpace'] && $i + $j === 12): ?> free<?php endif; ?><?php if (\in_array($i + $j, $card['marked'])): ?> marked<?php endif; ?>" data-cell="<?php echo $i + $j; ?>"><?php echo $card['grid'][$i + $j]; ?></div>
                            </td>
<?php endfor; ?>
                        </tr>
<?php endfor; ?>
                    </table>
<?php if ($card['gameEnded']): ?>
                    <div class="game-over-wrapper">
                        <div class="game-over">
                            <h3>Game Over</h3>
<?php if ($card['gameWinner']): ?>
                            <p>Winner: <span class="game-winner"><?php echo $card['gameWinner']; ?></span></p>
<?php endif; ?>
                            <div class="game-over-buttons">
                                <button class="cancel">Close</button>
                            </div>
                        </div>
                    </div>
<?php endif; ?>
                </div>
<?php endforeach; ?>
            </div>
        </div>
        <div class="card template">
            <h2 class="game-name"></h2>
            <p class="connect hidden">Fill 5 adjacent squares in a line.</p>
            <p class="fill hidden">Fill all squares.</p>
            <table class="grid">
                <tr>
                    <th class="letter-b">B</th>
                    <th class="letter-i">I</th>
                    <th class="letter-n">N</th>
                    <th class="letter-g">G</th>
                    <th class="letter-o">O</th>
                </tr>
<?php for ($i = 0; $i < 5; $i++): ?>
                <tr>
<?php for ($j = 0; $j <= 20; $j += 5): ?>
                    <td>
                        <div class="marker" data-cell="<?php echo $i + $j; ?>"></div>
                    </td>
<?php endfor; ?>
                </tr>
<?php endfor; ?>
            </table>
        </div>
        <div class="game-over-wrapper template">
            <div class="game-over">
                <h3>Game Over</h3>
                <p>Winner: <span class="game-winner"></span></p>
                <div class="game-over-buttons">
                    <button class="cancel">Close</button>
                </div>
            </div>
        </div>
        <script type="application/json" id="game-vars">
            {
                "gameToken": "<?php echo $gameToken; ?>"
            }
        </script>
<?php require __DIR__ . '/../_footer.php'; ?>
