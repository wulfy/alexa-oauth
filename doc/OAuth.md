# OAUTH

## Mon interpretation
Cette doc est avant tout un recueil des infos que j'ai pu trouver sur internet et une retranscription de ce que j'ai compris du fonctionnement de ce protocol.

Du coup il est possible qu'une partie des informations données soient approximatives voir erronées

le process est le suivant
- dans un premier temps l'application qui souhaite obtenir un token redirige l'utilisateur sur la plateforme qui doit lui donner afin que celui-ci puisse s'identifier (/login) en fournissant une URL de redirection permettant de récupérer le code temporaire de génération d'un token
- une fois l'identification validée par POST, l'utilisateur est redirigé vers le site qui demande le token avec les infos contenant son code de génération du token.
- l'application va appeler le service qui génère les token avec ses identifiants à elle (en base64 dans le paramètre "Authorization" du header ) + des paramètres du POST contenant l'id de l'appli et le code d'obtention d'un token.
- le service de génération du token va vérifier les données d'authorization (getClient) + vérifier le code d'autorisation (getAuthorizationCode). Si tout est bon il va générer le token, le sauvegarder et l'envoyer à l'application.
- enfin, pour chaque requete au service l'application utilisera le token comme autorisation

Some useful links
https://www.oauth.com/oauth2-servers/accessing-data/obtaining-an-access-token/
https://www.oauth.com/oauth2-servers/server-side-apps/authorization-code/
https://github.com/oauthjs/node-oauth2-server/blob/e1f741fdad191ee47e7764b80a8403c1ea2804d4/docs/model/spec.rst
https://oauth2.thephpleague.com/authorization-server/auth-code-grant/
https://developer.amazon.com/fr/docs/account-linking/configure-authorization-code-grant.html

OAUTH rfc
https://tools.ietf.org/html/rfc6749#section-1.6


## ressources 



SPECS node-oaut2-server (node module)
https://github.com/oauthjs/node-oauth2-server/blob/e1f741fdad191ee47e7764b80a8403c1ea2804d4/docs/model/spec.rst


How to build OAuth2 server with node.js
https://blog.cloudboost.io/how-to-make-an-oauth-2-server-with-node-js-a6db02dc2ce7
https://resources.infosecinstitute.com/securing-web-apis-part-ii-creating-an-api-authenticated-with-oauth-2-in-node-js/#gref
https://github.com/manjeshpv/node-oauth2-server-implementation

express OAuth2 module
https://github.com/oauthjs/express-oauth-server

