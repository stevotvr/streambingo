<?php

declare (strict_types = 1);

namespace Bingo\Controller;

use Bingo\App;
use Bingo\Config;
use Bingo\Exception\InternalErrorException;
use Bingo\Model\UserModel;

/**
 * Provides an interface to the user functionality.
 */
class UserController
{
    /**
     * Tries to get the current authenticated user.
     *
     * @return \Bingo\Model\UserModel|null The currently authenticated user, or null if the user is not authenticated
     */
    public static function getCurrentUser(): ?UserModel
    {
        if (!\session_id())
        {
            \session_start();
        }

        if (isset($_SESSION['user_id']))
        {
            return UserModel::loadUser($_SESSION['user_id']);
        }

        $accessToken = \filter_input(INPUT_COOKIE, 'access_token');
        if ($accessToken)
        {
            $userData = self::validateToken($accessToken);
            if ($userData)
            {
                $_SESSION['user_id'] = (int) $userData['user_id'];
                return UserModel::loadUser((int) $userData['user_id']);
            }
        }

        return null;
    }

    /**
     * Gets a user from the database.
     *
     * @param int $userId The unique identifier associated with the user
     *
     * @return \Bingo\Model\UserModel|null The user, or null if the user does not exist
     */
    public static function getUser(int $userId): ?UserModel
    {
        return UserModel::loadUser($userId);
    }

    /**
     * Gets an Twitch OAuth2 authorization URL.
     *
     * @param string $returnPath The URL path to which to return the user after authorization
     *
     * @return string The URL
     */
    public static function getAuthUrl(): string
    {
        if (!\session_id())
        {
            \session_start();
        }

        $_SESSION['return_url'] = Config::BASE_URL . Config::BASE_PATH . App::getRoute();
        $_SESSION['state'] = \md5((string) \mt_rand());

        $query = \http_build_query([
            'client_id'     => Config::TWITCH_APP_ID,
            'redirect_uri'  => Config::BASE_URL . Config::BASE_PATH . 'auth',
            'response_type' => 'code',
            'scope'         => 'chat:read',
            'state'         => $_SESSION['state'],
        ]);

        return 'https://id.twitch.tv/oauth2/authorize?' . $query;
    }

    /**
     * Processes an OAuth2 authorization code from Twitch.
     *
     * @param string $code The authorization code
     *
     * @return bool True if the authorization was successful, false otherwise
     *
     * @throws \Bingo\Exception\InternalErrorException
     */
    public static function processAuthCode(string $code): bool
    {
        $ch = \curl_init('https://id.twitch.tv/oauth2/token');
        if ($ch === false)
        {
            throw new InternalErrorException('Failed to connect to the Twitch API.');
        }

        \curl_setopt($ch, CURLOPT_POST, true);
        \curl_setopt($ch, CURLOPT_POSTFIELDS, [
            'client_id'     => Config::TWITCH_APP_ID,
            'client_secret' => Config::TWITCH_APP_SECRET,
            'code'          => $code,
            'grant_type'    => 'authorization_code',
            'redirect_uri'  => Config::BASE_URL . Config::BASE_PATH . 'auth',
        ]);
        \curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = \curl_exec($ch);
        $responseCode = \curl_getinfo($ch, CURLINFO_RESPONSE_CODE);

        \curl_close($ch);

        if ($responseCode === 200)
        {
            $response = \json_decode($response, true);
            if (self::setUserTokens($response['access_token'], $response['refresh_token']))
            {
                \setcookie('access_token', $response['access_token'], time() + 2592000);
                return true;
            }
        }

        return false;
    }

    /**
     * Sets the access and refresh tokens for a user.
     *
     * @param string $access The access token
     * @param string $refresh The refresh token
     *
     * @return bool True if the tokens were valid, false otherwise
     */
    protected static function setUserTokens(string $access, string $refresh): bool
    {
        $userData = self::validateToken($access);
        if ($userData === null)
        {
            return false;
        }

        $userId = (int) $userData['user_id'];
        $name = $userData['login'];

        $user = UserModel::loadUser($userId);
        if ($user)
        {
            $user->setName($name);
            $user->setTokens($access, $refresh);
        }
        else
        {
            $user = UserModel::createUser($userId, $name, $access, $refresh);
        }

        $user->save();

        return true;
    }

    /**
     * Validates an access token with the Twitch server.
     *
     * @param string $token The access token
     *
     * @return array|bool An array of user data from the Twitch API, or false if validation failed
     *
     * @throws \Bingo\Exception\InternalErrorException
     */
    protected static function validateToken(string $token)
    {
        $ch = \curl_init('https://id.twitch.tv/oauth2/validate');
        if ($ch === false)
        {
            throw new InternalErrorException('Failed to connect to the Twitch API.');
        }

        \curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: OAuth ' . $token,
        ]);
        \curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = \curl_exec($ch);
        $responseCode = \curl_getinfo($ch, CURLINFO_RESPONSE_CODE);

        \curl_close($ch);

        if ($responseCode === 200)
        {
            return \json_decode($response, true);
        }

        return false;
    }
}
