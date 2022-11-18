import Coach from './coach/Coach'
import dotenv from 'dotenv';
dotenv.config()

const coach = new Coach({
    token: {
        token: process.env.ACCESS_TOKEN||"",
        expires: new Date(Date.now() - 1800).toISOString() // Force to get a new token immedeatly
    },
    refreshToken: process.env.REFRESH_TOKEN||""
})

try {
    coach.getNewAccessToken()
} catch (e) {
    console.error(e)
}