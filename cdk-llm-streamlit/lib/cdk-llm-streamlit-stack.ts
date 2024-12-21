import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as elbv2_tg from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets'

const projectName = `llm-streamlit`; 
const region = process.env.CDK_DEFAULT_REGION;    
const accountId = process.env.CDK_DEFAULT_ACCOUNT;
const targetPort = 80;

export class CdkLlmStreamlitStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

      const ec2Role = new iam.Role(this, `role-ec2-for-${projectName}`, {
      roleName: `role-ec2-for-${projectName}-${region}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("ec2.amazonaws.com"),
        new iam.ServicePrincipal("bedrock.amazonaws.com"),
      )
    });

    const pvrePolicy = new iam.PolicyStatement({  
      resources: ['*'],
      actions: ['ssm:*', 'ssmmessages:*', 'ec2messages:*', 'tag:*'],
    });       
    ec2Role.attachInlinePolicy( // for isengard
      new iam.Policy(this, `pvre-policy-ec2-for-${projectName}`, {
        statements: [pvrePolicy],
      }),
    );  

    const BedrockPolicy = new iam.PolicyStatement({  
      resources: ['*'],
      actions: ['bedrock:*'],
    });        
    ec2Role.attachInlinePolicy( // add bedrock policy
      new iam.Policy(this, `bedrock-policy-ec2-for-${projectName}`, {
        statements: [BedrockPolicy],
      }),
    );     

    const ec2Policy = new iam.PolicyStatement({  
      resources: ['arn:aws:ec2:*:*:instance/*'],
      actions: ['ec2:*'],
    });
    ec2Role.attachInlinePolicy( // add bedrock policy
      new iam.Policy(this, `ec2-policy-for-${projectName}`, {
        statements: [ec2Policy],
      }),
    );

    // vpc
    const vpc = new ec2.Vpc(this, `vpc-for-${projectName}`, {
      vpcName: `vpc-for-${projectName}`,
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr("20.64.0.0/16"),
      natGateways: 1,
      createInternetGateway: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `public-subnet-for-${projectName}`,
          subnetType: ec2.SubnetType.PUBLIC
        }, 
        {
          cidrMask: 24,
          name: `private-subnet-for-${projectName}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
        },
      ],
    }); 
    // vpc.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Ec2 Security Group
    const ec2Sg = new ec2.SecurityGroup(this, `ec2-sg-for-${projectName}`,
      {
        vpc: vpc,
        allowAllOutbound: true,
        description: "Security group for ec2",
        securityGroupName: `ec2-sg-for-${projectName}`,
      }
    );
    // ec2Sg.addIngressRule(
    //   ec2.Peer.anyIpv4(),
    //   ec2.Port.tcp(22),
    //   'SSH',
    // );
    // ec2Sg.addIngressRule(
    //   ec2.Peer.anyIpv4(),
    //   ec2.Port.tcp(80),
    //   'HTTP',
    // );

    const userData = ec2.UserData.forLinux();
//     userData.addCommands(
//       'yum install nginx -y',
//       'service nginx start',
//       'yum install git python-pip -y',
//       'cd /local',
//       'git clone https://github.com/kyopark2014/llm-streamlit',
//       'pip install pip --upgrade',
//       'pip install streamlit boto3',      
//       'python3 -m venv venv',
//       'source venv/bin/activate',
//       `sh -c "cat <<EOF > /etc/systemd/system/streamlit.service
// [Unit]
// Description=Streamlit
// After=network-online.target

// [Service]
// User=ssm-user
// Group=ssm-user
// Restart=always
// ExecStart=/local/.local/bin/streamlit run /local/llm-streamlit/application/app.py

// [Install]
// WantedBy=multi-user.target
// EOF"`,
//       'systemctl enable streamlit.service',
//       'systemctl start streamlit'
//     );

    const commands = [
      'yum install nginx -y',
      'service nginx start',
      'yum install git python-pip -y',
      'pip install pip --upgrade',            
      `sh -c "cat <<EOF > /etc/systemd/system/streamlit.service
[Unit]
Description=Streamlit
After=network-online.target

[Service]
User=ssm-user
Group=ssm-user
Restart=always
ExecStart=/home/ssm-user/.local/bin/streamlit run /home/ssm-user/llm-streamlit/application/app.py

[Install]
WantedBy=multi-user.target
EOF"`,
      `runuser -l ssm-user -c 'cd && git clone https://github.com/kyopark2014/llm-streamlit'`,
      `runuser -l ssm-user -c 'pip install streamlit boto3'`,
      `runuser -l ssm-user -c 'python3 -m venv venv'`,
      `runuser -l ssm-user -c 'source venv/bin/activate'`,
      'systemctl enable streamlit.service',
      'systemctl start streamlit'
    ];

    userData.addCommands(...commands);

    // set User Data
    // const userData = ec2.UserData.forLinux();
    // const userDataScript = fs.readFileSync(path.join(__dirname, 'userdata.sh'), 'utf8');
    // userData.addCommands(userDataScript);

    // EC2 instance
    const appInstance = new ec2.Instance(this, `app-for-${projectName}`, {
      instanceName: `app-for-${projectName}`,
      instanceType: new ec2.InstanceType('t2.small'), // m5.large
      // instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.SMALL),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023
      }),
      // machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      vpc: vpc,
      vpcSubnets: {
        subnets: vpc.privateSubnets  
      },
      securityGroup: ec2Sg,
      role: ec2Role,
      userData: userData,
      blockDevices: [{
        deviceName: '/dev/xvda',
        volume: ec2.BlockDeviceVolume.ebs(8, {
          deleteOnTermination: true,
          encrypted: true,
        }),
      }],
      detailedMonitoring: true,
      instanceInitiatedShutdownBehavior: ec2.InstanceInitiatedShutdownBehavior.TERMINATE,
    }); 
    appInstance.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // ALB Target
    const targets: elbv2_tg.InstanceTarget[] = new Array();
    targets.push(new elbv2_tg.InstanceTarget(appInstance)); 

    // ALB SG
    const albSg = new ec2.SecurityGroup(this, `alb-sg-for-${projectName}`, {
      vpc: vpc,
      allowAllOutbound: true,
      securityGroupName: `alb-sg-for-${projectName}`,
      description: 'security group for alb'
    })
    ec2Sg.connections.allowFrom(albSg, ec2.Port.tcp(targetPort), 'allow traffic from alb') // alb -> ec2
    
    // ALB
    const alb = new elbv2.ApplicationLoadBalancer(this, `alb-for-${projectName}`, {
      internetFacing: true,
      vpc: vpc,
      vpcSubnets: {
        subnets: vpc.publicSubnets
      },
      securityGroup: albSg,
      loadBalancerName: `alb-for-${projectName}`
    })
    alb.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY); 

    // ALB Listener
    const listener = alb.addListener(`HttpListener-for-${projectName}`, {   
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,      
      // defaultAction: default_group
    }); 

    listener.addTargets(`WebEc2Target-for-${projectName}`, {
      targets,
      protocol: elbv2.ApplicationProtocol.HTTP,
      port: targetPort
    })  

    new cdk.CfnOutput(this, `albUrl-for-${projectName}`, {
      value: `http://${alb.loadBalancerDnsName}/`,
      description: 'albUrl',
      exportName: 'albUrl',
    });      
  }
}
    // const cloudfront_distribution = cloudFront.Distribution(this, "StreamLitCloudFrontDistribution",
    //   minimum_protocol_version=cloudFront.SecurityPolicyProtocol.SSL_V3,
    //   comment="CloudFront distribution for Streamlit frontend application",
    //   default_behavior=cloudfront.BehaviorOptions(
    //       origin=origins.LoadBalancerV2Origin(fargate_service.load_balancer, 
    //           protocol_policy=cloudfront.OriginProtocolPolicy.HTTP_ONLY, 
    //           http_port=80, 
    //           origin_path="/", 
    //           custom_headers = { custom_header_name : custom_header_value } ),
    //       viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    //       allowed_methods=cloudfront.AllowedMethods.ALLOW_ALL,
    //       cache_policy=cloudfront.CachePolicy.CACHING_DISABLED,
    //       origin_request_policy=cloudfront.OriginRequestPolicy.ALL_VIEWER_AND_CLOUDFRONT_2022,
    //       response_headers_policy=cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
    //       compress=False
    //   ),
    // );

    // const nlb = new elbv2.NetworkLoadBalancer(this, `nlb-for-${projectName}`, {
    //   vpc,
    //   loadBalancerName: `nlb-for-${projectName}`
    // });

    // const listener = nlb.addListener(`listener-${projectName}`, { port: 80 });
    // listener.addTargets('target', {
    //   targets,
    //   port: 80,
    // });

    // const httpEndpoint = new apigatewayv2.HttpApi(this, 'HttpProxyPrivateApi', {
    //   defaultIntegration: new apigatewayv2_integrations.HttpNlbIntegration('DefaultIntegration', listener),
    // });


    // // cloudfront
    // const custom_header_name = "X-Verify-Origin"
    // const custom_header_value = this.stackName+"_StreamLitCloudFrontDistribution"

    // const distribution = new cloudFront.Distribution(this, `cloudfront-for-${projectName}`, {
    //   comment: "CloudFront distribution for Streamlit frontend application",
    //   defaultBehavior: {
    //     origin: new origins.LoadBalancerV2Origin(alb, {
    //       protocolPolicy: cloudFront.OriginProtocolPolicy.HTTP_ONLY,
    //       httpPort: 80,
    //       originPath: "/",
    //       customHeaders: { [custom_header_name] : custom_header_value }
    //     }),
    //     allowedMethods: cloudFront.AllowedMethods.ALLOW_ALL,
    //     cachePolicy: cloudFront.CachePolicy.CACHING_DISABLED,
    //     viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    //   },
    //   priceClass: cloudFront.PriceClass.PRICE_CLASS_200,  
    // }); 

     /*   new cdk.CfnOutput(this, `WebUrl-for-${projectName}`, {
      value: 'https://'+distribution.domainName+'/',      
      description: 'The web url of request for chat',
    });     */


        // const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'AutoScalingGroup', {      
    //   autoScalingGroupName: `asg-for-${projectName}`,
    //   instanceType: new ec2.InstanceType('t2.small'),
    //   machineImage: new ec2.AmazonLinuxImage({
    //     generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023
    //   }), 
    //   vpc: vpc, 
    //   vpcSubnets: {
    //     subnets: vpc.publicSubnets  
    //   },
    //   securityGroup: ec2Sg,
    //   role: ec2Role,
    //   allowAllOutbound: true,
    //   minCapacity: 1,
    //   maxCapacity: 1,
    //   desiredCapacity: 1,
    //   healthCheck: autoscaling.HealthCheck.ec2()
    // });

    // const my_target_group = elbv2.ListenerAction.fixedResponse(200, {
    //   messageBody: 'OK',
    //   contentType: 'text/plain'
    // })

    // const default_action =elbv2.ListenerAction.redirect({
    //   host: distribution.domainName, 
    //   path: "/", 
    //   permanent: true, 
    //   port: "443", 
    //   protocol: "HTTPS"
    // })

     
    
    // listener.addAction(`RedirectHttpListener-for-${projectName}`, {
    //   action: default_action,
    //   conditions: [elbv2.ListenerCondition.httpHeader(custom_header_name, [custom_header_value])],
    //   priority: 5,
    // });
    // listener.addAction('DefaultAction', {
    //   action: elbv2.ListenerAction.fixedResponse(404, {
    //     contentType: "text/html",
    //     messageBody: 'Cannot route your request; no matching project found.',
    //   }),
    // });

    // const demoTargetGroup = listener.addTargets("demoTargetGroup", {
    //   port: 80,
    //   priority: 10,
    //   protocol: elbv2.ApplicationProtocol.HTTP,  
    //   conditions: [elbv2.ListenerCondition.httpHeader(custom_header_name, [custom_header_value])],
    //   targetGroupName: "demoTargetGroup",
    //   healthCheck: {
    //       path: "/content/de.html",
    //   }
    // });
    // listener.addTargetGroups("demoTargetGroupInt", {
    //     targetGroups: [demoTargetGroup]
    // })
    
    // elbv2.ListenerAction.redirect({ permanent: true, port: '443', protocol: 'HTTPS' })
          
    // listener.addTargets(`WebEc2Target-for-${projectName}`, {
    //   targets,
    //   priority: 1,
    //   conditions: [elbv2.ListenerCondition.httpHeader(custom_header_name, [custom_header_value])],
    //   protocol: elbv2.ApplicationProtocol.HTTP,
    //   port: targetPort
    // })
    // new elbv2.ApplicationListenerRule(this, 'RedirectApplicationListenerRule', {
    //   listener: listener,
    //   priority: 5,
    
    //   // the properties below are optional
    //   conditions: [elbv2.ListenerCondition.pathPatterns(["*"])],
    //   action: elbv2.ListenerAction.redirect()
    // });


    // API Gateway
    // const api = new apigwv2.HttpApi(this, `api-for-${projectName}`, {
    //   description: 'API Gateway for streamlit',
    //   apiName: `api-for-${projectName}`,      
    //   createDefaultStage: true,
    // });

    // new cdk.CfnOutput(this, `apigwUrl-for-${projectName}`, {
    //   value: `${api.url}`,
    //   description: 'api gateway Url',
    //   exportName: 'apigwUrl',
    // });   


    // // VPC Link Security Group    
    // const vpcLinkSg = new ec2.SecurityGroup(this, `vpclink-sg-for-${projectName}`, {
    //   vpc,      
    //   allowAllOutbound: true,
    //   securityGroupName: `vpclink-sg-for-${projectName}`,
    //   description: 'security group for vpclink'
    // })
    // vpcLinkSg.addIngressRule(
    //   ec2.Peer.anyIpv4(),
    //   ec2.Port.tcp(80),
    //   'HTTP',
    // );

    // const proxyIntegration = new HttpAlbIntegration(`integration-for-${projectName}`, alb.listeners[0], {
    //   vpcLink: vpcLink
    // }) 

    // api.addRoutes({
    //   path: '/{proxy+}',
    //   methods: [apigwv2.HttpMethod.ANY],
    //   // integration: new HttpAlbIntegration(`albIntegration-for-${projectName}`, listener),
    //   integration: proxyIntegration
    // }) 

    // // VPC Link
    // const vpcLink = new apigwv2.VpcLink(this, `VpcLink-for-${projectName}`, { 
    //   vpc,
    //   // subnets: vpc.selectSubnets({subnetType: ec2.SubnetType.PUBLIC}),
    //   subnets: vpc.selectSubnets({subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS}),
    //   securityGroups: [vpcLinkSg],
    //   vpcLinkName: `VpcLink-for-${projectName}`,
    // });    