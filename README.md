# Date Sniffer

A Chrome extension to extract post dates from TikTok videos and LinkedIn posts with just one click.

## Features

- Extract exact post dates from TikTok videos and LinkedIn posts
- Support for both direct URL input and automatic detection while browsing
- Copy dates to clipboard
- Shows dates in UTC format
- Works with LinkedIn comments as well

## How it Works

The extension extracts timestamps embedded in the IDs of TikTok videos and LinkedIn posts:

- **TikTok**: Extracts the first 31 bits from the video ID and converts it to a Unix timestamp
- **LinkedIn**: Uses the first 41 bits from post/comment IDs to get the creation timestamp
- These timestamps are then converted to human-readable UTC dates

## Installation

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder

## Privacy

The extension only extracts dates from URLs and doesn't collect or store any personal data. Required permissions:
- Access to TikTok and LinkedIn URLs
- Clipboard write (for copy feature)

## Contributing

Feel free to open issues and submit PRs. For major changes, please open an issue first to discuss what you would like to change.
