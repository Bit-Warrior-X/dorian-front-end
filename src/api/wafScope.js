export function wafApiBase(scope) {
  if (scope?.wafRuleId != null && scope.wafRuleId !== '') {
    return `/waf-rules/${scope.wafRuleId}/waf`
  }
  if (scope?.siteId != null && scope.siteId !== '') {
    return `/sites/${scope.siteId}/waf`
  }
  throw new Error('Missing site or WAF rule scope')
}
