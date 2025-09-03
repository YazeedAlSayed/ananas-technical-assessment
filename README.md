# AnanasTechnicalAssessment

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.15.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.


## Using ngrok (tunneling localhost:4200)

If you want to securely expose your local Angular dev server over the internet using ngrok:

1. Start the Angular dev server:
   
   ```bash
   ng serve
   ```

2. In a separate terminal, start ngrok for port 4200:
   
   ```bash
   ngrok http 4200
   ```

3. Copy the generated HTTPS URL. It will look like:
   
   ```
   https://5a25f6eb9b29.ngrok-free.app
   ```

4. Update the ngrok host in vite.config.js (host part only, without the https://):
   
   ```js
   // vite.config.js
   const NGROK_HOST = '5a25f6eb9b29.ngrok-free.app';
   export default defineConfig({
     server: { allowedHosts: [NGROK_HOST] }
   });
   ```

Notes
- The project uses Angular CLI; ngrok will tunnel your localhost:4200 directly. The provided vite.config.js simply prepares the project in case you run via Vite and need allowedHosts set.
- Each time ngrok URL changes, update the NGROK_HOST constant accordingly.
- If you need to access the server from your LAN without ngrok, you can run:
  
  ```bash
  ng serve --host 0.0.0.0
  ```
