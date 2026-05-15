
import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"

import { verifyJWT } from "../middleware/auth.middlewares.js"

const router = Router();
router.use(verifyJWT); 


router
    .route("/c/:channelId")
    .get(getUserChannelSubscribers) 
    .post(toggleSubscription);      

router.route("/u/:subscriberId").get(getSubscribedChannels); 

export default router;