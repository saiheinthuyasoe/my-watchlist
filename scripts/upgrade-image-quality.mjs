#!/usr/bin/env node
/**
 * Upgrade watchlist item cover images to higher resolution
 * 
 * This script updates all watchlist items that have low-resolution cover images
 * by fetching the latest data from AniList API and updating the coverImage URLs
 * to use the highest available quality (extraLarge or large).
 * 
 * Usage: node scripts/upgrade-image-quality.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const ANILIST_API = 'https://graphql.anilist.co';

// GraphQL query to fetch high-res cover image
const COVER_QUERY = `
  query ($id: Int!) {
    Media(id: $id) {
      id
      coverImage {
        extraLarge
        large
        medium
      }
    }
  }
`;

async function fetchHighResCover(anilistId) {
  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'MyWatchlist-ImageUpgrade/1.0',
      },
      body: JSON.stringify({
        query: COVER_QUERY,
        variables: { id: anilistId },
      }),
    });

    if (!response.ok) {
      throw new Error(`AniList API error: ${response.status}`);
    }

    const data = await response.json();
    const coverImage = data.data?.Media?.coverImage;
    
    // Return the highest resolution available
    return coverImage?.extraLarge ?? coverImage?.large ?? coverImage?.medium;
  } catch (error) {
    console.error(`  ❌ Failed to fetch cover for AniList ID ${anilistId}:`, error.message);
    return null;
  }
}

async function upgradeImageQuality() {
  console.log('🚀 Starting image quality upgrade...\n');

  try {
    // Fetch all watchlist items
    const snapshot = await db.collection('watchlist').get();
    console.log(`📊 Found ${snapshot.size} items in watchlist\n`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const currentUrl = data.coverImage || '';
      
      // Check if current URL is low resolution (contains 'medium' or old 'large')
      const isLowRes = currentUrl.includes('/medium/') || 
                       (!currentUrl.includes('/large/') && !currentUrl.includes('/extraLarge/'));
      
      if (!isLowRes && currentUrl) {
        skipped++;
        continue;
      }

      console.log(`🔄 Upgrading: ${data.title || 'Unknown'} (ID: ${data.anilistId})`);
      
      // Fetch high-res cover from AniList
      const highResCover = await fetchHighResCover(data.anilistId);
      
      if (highResCover && highResCover !== currentUrl) {
        await doc.ref.update({
          coverImage: highResCover,
          updatedAt: new Date(),
        });
        console.log(`  ✅ Updated to: ${highResCover.includes('/extraLarge/') ? 'EXTRA LARGE' : 'LARGE'}`);
        updated++;
      } else if (!highResCover) {
        console.log(`  ⚠️  Could not fetch high-res image`);
        failed++;
      } else {
        console.log(`  ℹ️  Already high resolution`);
        skipped++;
      }

      // Rate limiting - wait 700ms between requests (AniList allows 90/min)
      await new Promise(resolve => setTimeout(resolve, 700));
    }

    console.log('\n✨ Image upgrade complete!');
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total: ${snapshot.size}`);

  } catch (error) {
    console.error('❌ Error during upgrade:', error);
    process.exit(1);
  }
}

// Run the upgrade
upgradeImageQuality()
  .then(() => {
    console.log('\n✅ All done! Your watchlist images are now HD quality.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
