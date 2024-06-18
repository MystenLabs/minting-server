import Redis from 'ioredis';

const redis = new Redis({
    host: process.env.REDIS_HOST ?? "127.0.0.1",
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD,
  });

interface Job {
    timestamp: number;
    finishedOn: number;
    processedOn: number;
    requestsIncluded: number;
    requestTimestamps: number[];
    progress: number;
}

async function fetchJobs(): Promise<Job[]> {
    const keys = await redis.keys('bull:requests-queue:*');

    const jobKeys = keys.filter(key => key.match(/^bull:requests-queue:\d+$/));

    const jobs: Job[] = [];
    for (const key of jobKeys) {
        const data = await redis.hgetall(key);
        // console.log(data.data)
        if (data.timestamp && data.finishedOn && data.processedOn) {
            jobs.push({
                timestamp: parseInt(data.timestamp),
                finishedOn: parseInt(data.finishedOn),
                processedOn: parseInt(data.processedOn),
                requestsIncluded: JSON.parse(data.returnvalue).requests_included,
                requestTimestamps: JSON.parse(data.data).map((request: any) => request.timestamp),
                progress: parseInt(data.progress),

            });
        }
    }

    return jobs;
}

function calculateStatistics(jobs: Job[]) {
    if(jobs.length === 0) {
        console.log('No jobs found');
        return;
    }
    const requestfinishedTimes = jobs.map(job => job.requestTimestamps.map((t => job.finishedOn - t))).flat();
    
    const avgFinishesTime = requestfinishedTimes.reduce((acc, time) => acc + time, 0) / requestfinishedTimes.length;

    const requestsHappened = jobs.map(job => job.requestsIncluded);

    const requests = requestsHappened.reduce((acc, r) => acc + r, 0);

    console.log("Requests: ", requests);

    // TODO: find the gas cost with an api, as it is not provided from the effects
    // TODO: add all those calculations to summary.html

    console.log("Average Finish time, from the time that the requests happens: ", avgFinishesTime);
}

async function main() {
    const jobs = await fetchJobs();
    calculateStatistics(jobs);

    redis.disconnect();
}

main().catch(err => {
    console.log('Error:', err);
});