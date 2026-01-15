import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import AppleStrategy from 'passport-apple';

// Só configurar Google OAuth se as credenciais estiverem disponíveis
const googleClientID = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (googleClientID && googleClientSecret) {
  // Estratégia para Cliente
  passport.use(
    'google-cliente',
    new GoogleStrategy(
      {
        clientID: googleClientID,
        clientSecret: googleClientSecret,
        callbackURL: process.env.GOOGLE_CALLBACK_URL_CLIENTE || 'http://localhost:3001/api/auth/google/cliente/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const { id: googleId, displayName: nome, emails, photos } = profile;
          const email = emails?.[0]?.value;
          const foto = photos?.[0]?.value;

          if (!email) {
            return done(new Error('Email não fornecido pelo Google'), undefined);
          }

          return done(null, {
            googleId,
            nome,
            email,
            foto,
          });
        } catch (error) {
          return done(error, undefined);
        }
      }
    )
  );

  // Estratégia para Dono
  passport.use(
    'google-dono',
    new GoogleStrategy(
      {
        clientID: googleClientID,
        clientSecret: googleClientSecret,
        callbackURL: process.env.GOOGLE_CALLBACK_URL_DONO || 'http://localhost:3001/api/auth/google/dono/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const { id: googleId, displayName: nome, emails, photos } = profile;
          const email = emails?.[0]?.value;
          const foto = photos?.[0]?.value;

          if (!email) {
            return done(new Error('Email não fornecido pelo Google'), undefined);
          }

          return done(null, {
            googleId,
            nome,
            email,
            foto,
          });
        } catch (error) {
          return done(error, undefined);
        }
      }
    )
  );

  console.log('✅ Google OAuth configurado');
} else {
  console.log('⚠️  Google OAuth não configurado (GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET não encontrados)');
  console.log('   Login com Google estará desabilitado até que as credenciais sejam configuradas');
}

// Configurar Facebook OAuth
const facebookAppID = process.env.FACEBOOK_APP_ID;
const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;

if (facebookAppID && facebookAppSecret) {
  // Estratégia para Cliente
  passport.use(
    'facebook-cliente',
    new FacebookStrategy(
      {
        clientID: facebookAppID,
        clientSecret: facebookAppSecret,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL_CLIENTE || 'http://localhost:3001/api/auth/facebook/cliente/callback',
        profileFields: ['id', 'displayName', 'emails', 'photos'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const { id: facebookId, displayName: nome, emails, photos } = profile;
          const email = emails?.[0]?.value;
          const foto = photos?.[0]?.value;

          if (!email) {
            return done(new Error('Email não fornecido pelo Facebook'), undefined);
          }

          return done(null, {
            facebookId,
            nome,
            email,
            foto,
          });
        } catch (error) {
          return done(error, undefined);
        }
      }
    )
  );

  // Estratégia para Dono
  passport.use(
    'facebook-dono',
    new FacebookStrategy(
      {
        clientID: facebookAppID,
        clientSecret: facebookAppSecret,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL_DONO || 'http://localhost:3001/api/auth/facebook/dono/callback',
        profileFields: ['id', 'displayName', 'emails', 'photos'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const { id: facebookId, displayName: nome, emails, photos } = profile;
          const email = emails?.[0]?.value;
          const foto = photos?.[0]?.value;

          if (!email) {
            return done(new Error('Email não fornecido pelo Facebook'), undefined);
          }

          return done(null, {
            facebookId,
            nome,
            email,
            foto,
          });
        } catch (error) {
          return done(error, undefined);
        }
      }
    )
  );

  console.log('✅ Facebook OAuth configurado');
} else {
  console.log('⚠️  Facebook OAuth não configurado (FACEBOOK_APP_ID ou FACEBOOK_APP_SECRET não encontrados)');
  console.log('   Login com Facebook estará desabilitado até que as credenciais sejam configuradas');
}

// Configurar Apple OAuth
const appleClientID = process.env.APPLE_CLIENT_ID;
const appleTeamID = process.env.APPLE_TEAM_ID;
const appleKeyID = process.env.APPLE_KEY_ID;
const applePrivateKey = process.env.APPLE_PRIVATE_KEY;

if (appleClientID && appleTeamID && appleKeyID && applePrivateKey) {
  // Estratégia para Cliente
  passport.use(
    'apple-cliente',
    new AppleStrategy(
      {
        clientID: appleClientID,
        teamID: appleTeamID,
        keyID: appleKeyID,
        privateKeyString: applePrivateKey,
        callbackURL: process.env.APPLE_CALLBACK_URL_CLIENTE || 'http://localhost:3001/api/auth/apple/cliente/callback',
        scope: ['name', 'email'],
      },
      async (accessToken, refreshToken, idToken, profile, done) => {
        try {
          // Apple retorna informações diferentes
          const { sub: appleId, email } = profile;
          const nome = profile.name?.firstName && profile.name?.lastName
            ? `${profile.name.firstName} ${profile.name.lastName}`
            : profile.name?.firstName || profile.name?.lastName || 'Usuário';

          if (!email) {
            return done(new Error('Email não fornecido pelo Apple'), undefined);
          }

          return done(null, {
            appleId,
            nome,
            email,
            foto: null, // Apple não fornece foto diretamente
          });
        } catch (error) {
          return done(error, undefined);
        }
      }
    )
  );

  // Estratégia para Dono
  passport.use(
    'apple-dono',
    new AppleStrategy(
      {
        clientID: appleClientID,
        teamID: appleTeamID,
        keyID: appleKeyID,
        privateKeyString: applePrivateKey,
        callbackURL: process.env.APPLE_CALLBACK_URL_DONO || 'http://localhost:3001/api/auth/apple/dono/callback',
        scope: ['name', 'email'],
      },
      async (accessToken, refreshToken, idToken, profile, done) => {
        try {
          const { sub: appleId, email } = profile;
          const nome = profile.name?.firstName && profile.name?.lastName
            ? `${profile.name.firstName} ${profile.name.lastName}`
            : profile.name?.firstName || profile.name?.lastName || 'Usuário';

          if (!email) {
            return done(new Error('Email não fornecido pelo Apple'), undefined);
          }

          return done(null, {
            appleId,
            nome,
            email,
            foto: null,
          });
        } catch (error) {
          return done(error, undefined);
        }
      }
    )
  );

  console.log('✅ Apple OAuth configurado');
} else {
  console.log('⚠️  Apple OAuth não configurado (credenciais não encontradas)');
  console.log('   Login com Apple estará desabilitado até que as credenciais sejam configuradas');
}

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});
