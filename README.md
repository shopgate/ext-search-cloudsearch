# Shopgate Connect - Extension Amazon CloudSearch search

## Configuration

Set the following value in your Shopgate Connect Admin:

* sortExpressions - (json) map for sort expressions

You can check expression documentation at [Cloud Search Dev documentation](https://docs.aws.amazon.com/cloudsearch/latest/developerguide/configuring-expressions.html) 


## Example value
```
{
  "sortExpressions": {
    "rankOrScore": "rank||_score"
  }
}
```

## Soft Dependency

For now Sort expressions can be used along with [Sort Options extension](https://github.com/shopgate-professional-services/ext-sort-options) 
as sort options for Search pages in Engage

## About Shopgate

Shopgate is the leading mobile commerce platform.

Shopgate offers everything online retailers need to be successful in mobile. Our leading
software-as-a-service (SaaS) enables online stores to easily create, maintain and optimize native
apps and mobile websites for the iPhone, iPad, Android smartphones and tablets.


## License

Shopgate Connect - Extension Amazon CloudSearch search is available under the Apache License, Version 2.0.

See the [LICENSE](./LICENSE) file for more information.
