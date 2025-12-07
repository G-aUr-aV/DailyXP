import mongoose from 'mongoose';

// Time-series collection for video progress tracking
const videoProgressSchema = new mongoose.Schema({
    questId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quest',
        required: true
    },
    currentTime: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    metadata: {
        sessionDuration: Number, // How long user watched this session
        percentComplete: Number,
        videoTitle: String
    }
}, {
    timeseries: {
        timeField: 'timestamp',
        metaField: 'metadata',
        granularity: 'seconds'
    }
});

// Index for efficient lookups
videoProgressSchema.index({ questId: 1, timestamp: -1 });

const VideoProgress = mongoose.model('VideoProgress', videoProgressSchema);

export default VideoProgress;
