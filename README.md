
[![New Relic One Catalog Project header](https://github.com/newrelic/opensource-website/raw/master/src/images/categories/New_Relic_One_Catalog_Project.png)](https://opensource.newrelic.com/oss-category/#new-relic-one-catalog-project)

# Metric Aggregator

![CI](https://github.com/newrelic/nr1-metrics-aggregator/workflows/CI/badge.svg) ![GitHub release (latest SemVer including pre-releases)](https://img.shields.io/github/v/release/newrelic/nr1-metrics-aggregator?include_prereleases&sort=semver) [![Snyk](https://snyk.io/test/github/newrelic/nr1-network-telemetry/badge.svg)](https://snyk.io/test/github/newrelic/nr1-metrics-aggregator)

## Usage

The Metric Aggregator is a New Relic ONE Application that helps you create an Event To Metric (E2M) rule. Events-to-metrics is a New Relic real-time streaming service that converts event data into dimensional metrics at ingest. New Relic stores these Metrics for 13+ months used for long-term trending.

For additional details on what E2M is and why you would use it, see [Events-to-Metrics in the New Relic documentation](https://docs.newrelic.com/docs/data-ingest-apis/get-data-new-relic/metric-api/introduction-events-metrics-service).

This 3-minute video demonstrates how you can adjust your New Relic Event retention in conjunction with E2M for long-term trending:
[![E2M](https://img.youtube.com/vi/3o-dna1GVwU/0.jpg)](https://www.youtube.com/watch?v=3o-dna1GVwU)


## Open Source License

This project is distributed under the [Apache 2 license](./LICENSE).

## Dependencies

If you use New Relic, you already have New Relic Metrics. You can begin to create E2M rules immediately.

## Getting started

First, ensure that you have [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [NPM](https://www.npmjs.com/get-npm) installed. If you're unsure whether you have one or both of them installed, run the following command(s) (If you have them installed these commands will return a version number, if not, the commands won't be recognized):

```bash
git --version
npm -v
```

Next, clone this repository and run the following scripts:

```bash
nr1 nerdpack:clone -r https://github.com/newrelic/nr1-metrics-aggregator.git
cd nr1-metrics-aggregator
nr1 nerdpack:serve
```

Visit [https://one.newrelic.com/?nerdpacks=local](https://one.newrelic.com/?nerdpacks=local), navigate to the Nerdpack, and :sparkles:

## Deploying this Nerdpack

Open a command prompt in the nerdpack's directory and run the following commands.

```bash
# To create a new uuid for the nerdpack so that you can deploy it to your account:
# nr1 nerdpack:uuid -g [--profile=your_profile_name]

# To see a list of APIkeys / profiles available in your development environment:
# nr1 profiles:list

nr1 nerdpack:publish [--profile=your_profile_name]
nr1 nerdpack:deploy [-c [DEV|BETA|STABLE]] [--profile=your_profile_name]
nr1 nerdpack:subscribe [-c [DEV|BETA|STABLE]] [--profile=your_profile_name]
```

Visit [https://one.newrelic.com](https://one.newrelic.com), navigate to the Nerdpack, and :sparkles:

## Community Support

New Relic hosts and moderates an online forum where you can interact with New Relic employees as well as other customers to get help and share best practices. Like all New Relic open source community projects, there's a related topic in the New Relic Explorers Hub. You can find this project's topic/threads here:

[https://discuss.newrelic.com/t/metric-aggregator-nerdpack/101069](https://discuss.newrelic.com/t/metric-aggregator-nerdpack/101069)

Please do not report issues with the Metric Aggregator to New Relic Global Technical Support. Instead, visit the [`Explorers Hub`](https://discuss.newrelic.com/t/metric-aggregator-nerdpack/101069) for troubleshooting and best-practices.

## Issues / Enhancement Requests

Issues and enhancement requests can be submitted in the [Issues tab of this repository](https://github.com/newrelic/nr1-metrics-aggregator/issues). Please search for and review the existing open issues before submitting a new issue.

## Security

As noted in our [security policy](https://github.com/newrelic/nr1-metrics-aggregator/security/policy), New Relic is committed to the privacy and security of our customers and their data. We believe that providing coordinated disclosure by security researchers and engaging with the security community are important means to achieve our security goals.

If you believe you have found a security vulnerability in this project or any of New Relic's products or websites, we welcome and greatly appreciate you reporting it to New Relic through [HackerOne](https://hackerone.com/newrelic).

## Contributing

Contributions are welcome (and if you submit a Enhancement Request, expect to be invited to contribute it yourself :grin:). Please review our [Contributors Guide](./CONTRIBUTING.md).

Keep in mind that when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. If you'd like to execute our corporate CLA, or if you have any questions, please drop us an email at opensource+nr1-metrics-aggregator@newrelic.com.
