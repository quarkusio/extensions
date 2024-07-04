//usr/bin/env jbang "$0" "$@" ; exit $?

//JAVA 17+

//DEPS https://github.com/holly-cummins/github-api/tree/main
//DEPS info.picocli:picocli:4.2.0

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.kohsuke.github.GHIssue;
import org.kohsuke.github.GHRepository;
import org.kohsuke.github.GitHub;
import org.kohsuke.github.GitHubBuilder;
import org.kohsuke.github.PagedIterator;
import org.kohsuke.github.PagedSearchIterable;
import picocli.CommandLine;
import picocli.CommandLine.Command;
import picocli.CommandLine.Option;

import java.io.File;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.Collections;
import java.util.stream.Collectors;

@Command(name = "report", mixinStandardHelpOptions = true,
        description = "Raises and closes issues depending on the results of bad image checking")
class Report implements Runnable {

    // We need a marker to search for, but double quotes are not honoured, and hyphenated terms
    // are split.
    // We can't use a label because we may not have the right privileges in the repo we're
    // raising an issue in
    private static final String EYECATCHER = "QuarkusExtensionsBadImageHelper";
    public static final String OUTPUT_PATH = "bad-image-check-results.json";
    @Option(names = "token", description = "Github token to use when calling the Github API")
    private String token;

    @Option(names = "siteUrl", description = "Base url of the external site ")
    private String siteUrl;

    @Option(names = "issueRepo", description = "The repository where issues should be raised if " +
            "we cannot identify an owning repository (i.e. quarkusio/quarkus)")
    private String issueRepo;

    @Option(names = "dryRun", description = "Whether to go through with making changes to the " +
            "live repo")
    private boolean dryRun;

    @Option(names = "runId", description = "The ID of the Github Action run")
    private String runId;

    @Override
    public void run() {
        try {
            final GitHub github = new GitHubBuilder().withAppInstallationToken(token)
                    .build();

            List<BadImage> links = readTestOutputFile();

            links.forEach(link -> processBadImage(github, link));

            // Close any issues that don't relate to these
            closeResolvedIssues(github, links);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private void closeResolvedIssues(GitHub github, List<BadImage> links) throws IOException {
        String term = String.format("is:issue is:open %s in:body", EYECATCHER);
        PagedSearchIterable<GHIssue> answer = github.searchIssues()
                .q(term)
                .list();

        PagedIterator<GHIssue> iterator = answer.iterator();

        while (iterator.hasNext()) {
            GHIssue issue = iterator.next();
            // Look through our bad images to see if one matches
            String title = issue.getTitle();

            BadImage matchingLink = links.stream()
                    .filter(link -> title.contains(link.url()))
                    .findAny()
                    .orElse(null);


            if (matchingLink == null) {
                // close issue with a comment
                final String comment = String.format(
                        "Build fixed:\n* Link to latest CI run: https://github" +
                                ".com/%s/actions/runs/%s", issueRepo, runId);

                if (!dryRun) {
                    issue.comment(comment);
                    issue.close();
                } else {
                    System.out.println(
                            String.format("Dry run: would close issue %s", issue.getHtmlUrl()
                                    .toString()));
                    System.out.println("Comment would be: " + comment);
                }
            } else {
                // Do nothing
                System.out.println(
                        String.format("Keeping %s open as it is still broken in tests.",
                                issue.getHtmlUrl()
                                        .toString()));

            }


        }
    }

    private String getOwningPages(String[] slugs) {
        return Arrays.stream(slugs).map(slug -> siteUrl + "/" + slug).collect(Collectors.joining("\n - "));
    }

    private void processBadImage(GitHub github, BadImage link) {
        try {

            System.out.println(String.format("Found a bad image: %s", link.url));

            final GHRepository repository = github.getRepository(issueRepo);

            //Be aware that double quotes are not honoured and terms are generally split and AND-ed.
            // Don't require our eyecatcher, count any existing issue about this url as good enough
            String term = String.format("is:issue is:open \"%s\" in:title repo:%s", link.url(), issueRepo);
            PagedSearchIterable<GHIssue> answer = github.searchIssues()
                    .q(term)
                    .list();

            // If there's no matching defect ...
            if (answer.getTotalCount() == 0) {
                String title = String.format("%s image: %s", link.reason, link.url);
                String body = String.format("""
                        %s image: %s

                        The problem image was found on these artifacts: %s
                                                
                        Affected pages are 
                        - %s

                        This issue was auto-created by the bad image helper.

                         --- %s --- Do not remove this line or the bad image helper will not be able to manage this issue
                         """, link.reason, link.url, Arrays.toString(link.artifacts), getOwningPages(link.slugs), EYECATCHER);

                if (!dryRun) {
                    GHIssue issue = repository.createIssue(title)
                            .body(body)
                            .create();
                    System.out.println(String.format("Created issue: %s", issue.getHtmlUrl()));
                } else {
                    System.out.println(
                            String.format("Dry run: NOT creating issue:\n %s\n%s", title, body));

                }
            } else {
                // Do nothing
                GHIssue issue = answer.iterator()
                        .next();
                System.out.println(
                        String.format("Found an issue already covering this bad image: %s: %s",
                                issue.getNumber(), issue.getTitle()));
            }

        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private List<BadImage> readTestOutputFile() throws IOException {
        Path filePath = FileSystems.getDefault()
                .getPath(OUTPUT_PATH);
        if (Files.exists(filePath)) {
            try {
                return Arrays.asList(new ObjectMapper().readValue(filePath.toFile(), BadImage[].class));
            } catch (JsonProcessingException e) {
                throw new RuntimeException(e);
            }
        } else {
            return Collections.emptyList();
        }
    }

    public static void main(String... args) {
        int exitCode = new CommandLine(new Report()).execute(args);
        System.exit(exitCode);
    }

    record BadImage(
            String url,
            String reason,
            String[] artifacts,
            String[] slugs) {
    }
}