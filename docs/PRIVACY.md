# Privacy model

Let It Burn is a static browser application.

## What happens to an offering

1. Text remains in React component memory for the current session.
2. A selected file is represented by the browser's native `File` object.
3. Images receive a temporary `blob:` URL so the browser can draw them.
4. The offering is rendered to an in-memory canvas for the selected ritual.
5. Temporary image URLs are revoked when the offering changes or the app closes.

## What never happens

- The application does not send file or text content to a server.
- It does not modify or delete the original file.
- It does not use cookies, analytics, accounts, or browser storage.
- It does not load third-party fonts, scripts, images, sound, or tracking pixels.

The downloadable release receipt contains the offering label or file name, ritual
name, and completion phrase. It does not contain the original file contents.
