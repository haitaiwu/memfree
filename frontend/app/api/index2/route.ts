import { getUserById } from '@/lib/db';
import { log } from '@/lib/log';
import { isValidUrl } from '@/lib/shared-utils';
import { NextResponse } from 'next/server';

const API_TOKEN = process.env.API_TOKEN!;

let vectorIndexHost = '';
// Let open source users could one click deploy
if (process.env.VECTOR_INDEX_HOST) {
    vectorIndexHost = process.env.VECTOR_INDEX_HOST;
} else if (process.env.VECTOR_HOST) {
    vectorIndexHost = process.env.VECTOR_HOST;
} else if (process.env.MEMFREE_HOST) {
    vectorIndexHost = `${process.env.MEMFREE_HOST}/vector`;
} else {
    throw new Error(
        'Neither VECTOR_INDEX_HOST, VECTOR_HOST, nor MEMFREE_HOST is defined',
    );
}

export async function POST(req: Request) {
    const { urls, userId } = await req.json();

    try {
        const invalidUrls = urls.filter((u) => !isValidUrl(u));
        if (invalidUrls.length > 0) {
            return NextResponse.json(
                {
                    error: 'Please enter valid URLs, they should start with http:// or https://.',
                    invalidUrls,
                },
                { status: 400 },
            );
        }
        // TODO: Check if the user is authenticated
        const user = await getUserById(userId);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        }
        if (urls.length > 10) {
            return NextResponse.json(
                {
                    error: 'The maximum number of webpages indexed at one time is 10',
                },
                { status: 400 },
            );
        }
        // TODO: rename the endpoint to /api/vector/index
        const fullUrl = `${vectorIndexHost}/api/vector/callback`;

        const requests = urls.map((url) => {
            return fetch(fullUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `${API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, userId: user.id }),
            })
                .then((response) => {
                    if (!response.ok) {
                        console.error(
                            `Index Url Error! status: ${response.status}`,
                        );
                        throw new Error(
                            `Index Url Error! status: ${response.status}`,
                        );
                    }
                    return response.json();
                })
                .then((result) => ({ url, result }))
                .catch((error) => {
                    log({
                        service: 'index-url',
                        action: `error-index-url`,
                        error: `${error}`,
                        url: url,
                        userId: userId,
                    });
                    console.error(`Error for ${url}:`, error);
                    return { url, error: error.message };
                });
        });

        const results = await Promise.all(requests);
        const successfulUrls = results.filter((r) => !r.error);
        const failedUrls = results.filter((r) => r.error);

        if (successfulUrls.length === 0) {
            return NextResponse.json(
                { error: 'All URL requests failed' },
                { status: 500 },
            );
        }

        return NextResponse.json({
            successfulUrls: successfulUrls.map((r) => r.url),
            failedUrls: failedUrls.map((r) => ({ url: r.url, error: r.error })),
        });
    } catch (error) {
        console.error('Index Request failed:', error);
        return NextResponse.json({ error: `${error}` }, { status: 500 });
    }
}
