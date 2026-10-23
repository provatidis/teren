# Publishing Teren at teren.sh

Keep the current repository, commit history, issues and GitHub Pages workflow. Cloudflare provides the domain and DNS; GitHub Pages continues to host the static app. Renaming the repository and connecting the public domain are separate settings.

## Cutover order

1. Before changing the published address, export any saved experiment library and pool/position JSON you want to keep from the current site. Browser storage belongs to an origin. Lesson progress, sandbox balances and working drafts do not automatically move to `teren.sh`, and the experiment export does not include them.
2. Review the Teren release and its passing checks on the existing repository. Rename that same repository to `teren` in **Settings → General → Repository name** when ready; do not create a replacement repository. Update the local Git remote to `https://github.com/provatidis/teren.git`.
3. In the account's **Settings → Pages**, add `teren.sh` as a verified domain. GitHub supplies a TXT record whose name begins `_github-pages-challenge-provatidis`. Add the exact supplied name and value in Cloudflare and complete verification. Keep that TXT record after verification.
4. In the repository's **Settings → Pages**, keep the publishing source set to **GitHub Actions**, enter `teren.sh` under **Custom domain**, and save it. The Actions deployment does not use a `CNAME` file to set this value.
5. Add the following web records in **Cloudflare → teren.sh → DNS → Records**. Set proxy status to **DNS only** (grey cloud) and TTL to **Auto**. Replace conflicting web records for the same name if necessary; preserve unrelated records, including mail and verification records.

| Type | Name | Content |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `provatidis.github.io` |

6. Wait for GitHub's DNS check and certificate provisioning, then enable **Enforce HTTPS**. The `www` record points directly to `provatidis.github.io`, without a repository path. GitHub redirects `www.teren.sh` to the configured apex domain.
7. Merge the verified release and confirm that the Pages deployment succeeds. Check `https://teren.sh/`, Learn, About, Methods, the favicon, a shared scenario and a nested missing URL. Confirm that the custom domain remains configured and HTTPS is enforced. Update the repository's About website to `https://teren.sh/`.
8. Import the saved experiment library and snapshot files on the new domain. Prior-format files remain supported. Use `teren.sh` for new shared links.

The source metadata already targets `teren.sh` and the repository links target `provatidis/teren`, so both settings must be in place before this release is published. No legacy redirect repository or additional hosting service is needed.

Official references: [GitHub custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [GitHub domain verification](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages), and [Cloudflare DNS records](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/).
