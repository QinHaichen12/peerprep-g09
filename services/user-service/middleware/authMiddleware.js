import firebaseApp from '../config/firebase.js';

export const verifyAdmin = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; 
    if (!token) {
        return res.status(401).json({ error: "Unauthorized. No token provided." });
    }

    try {
        const decodedToken = await firebaseApp.auth.verifyIdToken(token);
        if (decodedToken.role === 'Admin') {
            req.user = decodedToken;
            next();
        } else {
            res.status(403).json({ error: "Forbidden. Admin rights required." });
        }
    } catch (error) {
        res.status(401).json({ error: "Invalid or expired token." });
    }
};

export default verifyAdmin