import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();


const app = express();
const port = 3002;
app.use(cors());

const browser = await puppeteer.launch({
    timeout: 0,
    headless: false,
    args: ['--lang=en-EN,en', "--no-sandbox"],
    executablePath: process.env.NODE_ENV === 'production' ?
        process.env.PUPPETEER_EXECUTABLE_PATH :
        puppeteer.executablePath(),

});

const getFrequencyLast90Days = async (url) => {


    const page = await browser.newPage();

    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "language", {
            get: function() {
                return "en-EN";
            }
        });
        Object.defineProperty(navigator, "languages", {
            get: function() {
                return ["en-EN", "en"];
            }
        });
    });

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    await page.setViewport({width: 1920, height: 1080});

    const photoDates = [];
    const videoDates = [];
    const allPhotosElement  = await page.waitForSelector('.ofKBgf');

        if (allPhotosElement) {
            await allPhotosElement.click();
            const allPhotosToOpen = await page.waitForSelector('.m6QErb.XiKgde');
            if(allPhotosToOpen) {
                let index = 0;
                while (true) {
                    try {
                        const singlePhotoToOpen = await page.waitForSelector(`a[data-photo-index="${index}"]`, { timeout: 2000 });
                        if(singlePhotoToOpen){
                            await singlePhotoToOpen.click()
                            const date = await page.waitForSelector('.mqX5ad');
                            await page.waitForFunction(() => {
                                const element = document.querySelector('.mqX5ad');
                                return element && /\d+/.test(element.textContent.trim());
                            }, { timeout: 0 });
                            const dateElement = await page.$('.mqX5ad');
                            const text = await dateElement.evaluate(el => el.textContent);
                            console.log('text', text)
                            const lines = text.split('\n');

                            lines.forEach(line => {
                                const [type, dateStr] = line?.split('–') || [];
                                console.log('type',type)
                                if (type.trim().includes('Photo') || type.trim().includes('Фотографія')) {
                                    photoDates.push(dateStr);
                                } else if (type.trim() === 'Video' || type.trim() === 'Відео') {
                                    videoDates.push(dateStr);
                                }
                            });
                            index++
                        } else {
                            break;
                        }
                    } catch (e) {
                        break;
                    }
                }
            }

        } else {
            console.log('allPhotosElement not found');
        }

    const videoFrequencyLast90Days = countResentMedia(videoDates);
    const photoFrequencyLast90Days = countResentMedia(photoDates);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');

    let totalElements = 0;
    let mgX1WContents = [];

    const scrollToBottomAndWaitForLoad = async (selector) => {
        const element = await page.$(selector);
        let previousHeight = await page.evaluate(el => el.scrollHeight, element);
        await new Promise(resolve => setTimeout(resolve, 4000));

        while (true) {

            await page.evaluate(el => {
                el.scrollBy(0, el.scrollHeight);
            }, element);

            await new Promise(resolve => setTimeout(resolve, 1500));

            let newHeight = await page.evaluate(el => el.scrollHeight, element);

            if (newHeight === previousHeight) {
                break;
            }

            previousHeight = newHeight;
        }

        const elementsCount = await page.evaluate(selector => {
            return document.querySelectorAll('.Tc0rEd.cKbrCd').length;
        }, selector);
        totalElements += elementsCount;
        const mgX1WContent = await page.evaluate(() => {
            const mgX1WElements = document.querySelectorAll('.mgX1W');
            return Array.from(mgX1WElements, element => element.innerText);
        });
        mgX1WContents = mgX1WContents.concat(mgX1WContent);

        return totalElements;
    };

    function countResentMedia(posts) {
        const today = new Date();
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(today.getDate() - 90);

        let count = 0;

        posts.forEach(post => {
            let postDate;

            if (post?.includes('minute')) {
                const minutesAgo = parseInt(post);
                postDate = new Date();
                postDate.setMinutes(today.getMinutes() - minutesAgo);
            } else if (post?.includes('hour')) {
                const hoursAgo = parseInt(post);
                postDate = new Date();
                postDate.setHours(today.getHours() - hoursAgo);
            } else if (post?.includes('day')) {
                const daysAgo = parseInt(post);
                postDate = new Date();
                postDate.setDate(today.getDate() - daysAgo);
            } else if (post?.includes('month')) {
                const monthsAgo = parseInt(post);
                postDate = new Date();
                postDate.setMonth(today.getMonth() - monthsAgo);
            } else if (post?.includes('year')) {
                return;
            } else {
                const [month, year] = post?.split(' ') || [];
                postDate = new Date(Date.parse(`${month} 1, ${year}`));
            }
            console.log('post',post)
            console.log('postDate', postDate, ninetyDaysAgo,today)
            if (postDate >= ninetyDaysAgo && postDate <= today) {
                count++;
            }
        });

        return count;
    }

    function countRecentPosts(posts) {
        const today = new Date();
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(today.getDate() - 90);

        let count = 0;

        console.log('posts',posts)

        posts.forEach(post => {
            let postDate;

            if (post?.includes('minute')) {
                const minutesAgo = parseInt(post);
                postDate = new Date();
                postDate.setMinutes(today.getMinutes() - minutesAgo);
            } else if (post?.includes('hour')) {
                const hoursAgo = parseInt(post);
                postDate = new Date();
                postDate.setHours(today.getHours() - hoursAgo);
            } else if (post?.includes('day')) {
                const daysAgo = parseInt(post);
                postDate = new Date();
                postDate.setDate(today.getDate() - daysAgo);
            } else if (post?.includes('week')) {
                const weeksAgo = parseInt(post);
                postDate = new Date();
                postDate.setDate(today.getDate() - weeksAgo * 7);
            } else if (post?.includes('month')) {
                const monthsAgo = parseInt(post);
                postDate = new Date();
                postDate.setMonth(today.getMonth() - monthsAgo);
            } else if (post?.includes('year')) {
                return;
            } else {
                postDate = new Date(Date.parse(post));
            }

            if (postDate >= ninetyDaysAgo && postDate <= today) {
                count++;
            }
        });

        return count || 0;
    }

    const getPostsData = async () => {
        try {
            const postsTabSelector = '.Q7eoI';
            await page.waitForSelector(postsTabSelector, {timeout:2000});
            await page.click(postsTabSelector);

            const contentSelector = '.m6QErb.DxyBCb.kA9KIf.dS8AEf.XiKgde';
            await page.waitForSelector(contentSelector);

            const totalPosts = await scrollToBottomAndWaitForLoad(contentSelector);

            const postFrequencyLast90Days = countRecentPosts(mgX1WContents);
            console.log('postFrequencyLast90Days!!',postFrequencyLast90Days)
            return {postFrequencyLast90Days, totalPosts}

        } catch (e) {
            console.log(e)
            return {postFrequencyLast90Days: 0, totalPosts: 0}
        }
    }
    const {postFrequencyLast90Days, totalPosts} = await getPostsData()

    console.log('Video Frequency (last 90 days):', videoFrequencyLast90Days);
    console.log('Photo Frequency (last 90 days):', photoFrequencyLast90Days);
    console.log('postFrequencyLast90Days',postFrequencyLast90Days)
    console.log('totalPosts',totalPosts)
    console.log('total videos',videoDates.length)
    console.log('total photos',photoDates.length)

    await page.close();

    return {
        photoFrequency: photoFrequencyLast90Days,
        videoUploads: videoDates.length,
        videoFrequency: videoFrequencyLast90Days,
        totalPosts: totalPosts,
        postFrequency: postFrequencyLast90Days,
        totalPhotos: photoDates.length
    };
};

app.get('/', async (req, res) => {
    res.json('hello')
})

app.get('/frequency', async (req, res) => {
    const url = req.query.url; // Получаем URL из параметра запроса
    console.log('url', url)
    if (!url) {
        return res.status(400).send('URL parameter is missing');
    }

    try {
        const frequencies = await getFrequencyLast90Days(url);
        res.json(frequencies);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
