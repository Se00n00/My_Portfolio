### Notes to Myself:
First Build the files after new changes
```
ng build --configuration production --base-href=/My_Portfolio/
```
And, Then Deploy
```
npx angular-cli-ghpages --dir=dist/dl-portfolio/browser --repo=https://github.com/Se00n00/My_Portfolio.git --branch=gh-pages
```
