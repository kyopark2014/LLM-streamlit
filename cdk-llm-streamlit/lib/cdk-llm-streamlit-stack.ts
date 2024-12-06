import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancing';
import * as fs from 'fs';
import * as path from 'path';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as elbv2_tg from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets'

const projectName = `llm-streamlit`; 
const region = process.env.CDK_DEFAULT_REGION;    
const accountId = process.env.CDK_DEFAULT_ACCOUNT;

export class CdkLlmStreamlitStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // const policy = new iam.PolicyDocument({
    //   statements: [
    //     new iam.PolicyStatement({
    //       effect: iam.Effect.ALLOW,
    //       actions: [
    //         'ec2:*'
    //       ],
    //       resources: ['arn:aws:ec2:*:*:instance/*'],
    //     }),
    //     new iam.PolicyStatement({
    //       effect: iam.Effect.ALLOW,
    //       actions: [
    //         'bedrock:*'
    //       ],
    //       resources: ['*'],
    //     }),
    //     new iam.PolicyStatement({
    //       effect: iam.Effect.ALLOW,
    //       actions: [
    //         'ssm:GetParameter',
    //         'ssm:GetParameters',
    //       ],
    //       resources: ['*'],
    //     }),
    //   ],
    // });

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
      maxAzs: 1,
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
    vpc.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // const publicSubnet = new ec2.PublicSubnet(this, `public-subnet-for-${projectName}`, {
    //   availabilityZone: vpc.availabilityZones[0],
    //   cidrBlock: vpc.vpcCidrBlock,
    //   vpcId: vpc.vpcId      
    // }); 
    
    const ec2SecurityGroup = new ec2.SecurityGroup(this, `ec2-sg-for-${projectName}`,
      {
        vpc: vpc,
        allowAllOutbound: true,
        description: "Security group for ec2",
        securityGroupName: `ec2-sg-for-${projectName}`,
      }
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'httpIpv4',
    );
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'httpIpv4',
    );
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8501),
      'httpIpv4',
    ); 

    const albSg = new ec2.SecurityGroup(this, 'AlbSg', {
      vpc,
      allowAllOutbound: true,
      description: 'security group for alb'
    })
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'allow http traffic from anyone')


    const alb = new elbv2.ApplicationLoadBalancer(this, `alb-for-${projectName}`, {
      internetFacing: true,
      vpc,
      vpcSubnets: {
        subnets: vpc.publicSubnets
      },
      securityGroup: albSg
    })
    ec2SecurityGroup.connections.allowFrom(albSg, ec2.Port.tcp(80), 'allow http traffic from alb')
    ec2SecurityGroup.connections.allowFrom(albSg, ec2.Port.tcp(8501), 'allow http traffic from alb')


    // set AMI
    // const ec2Image = ec2.MachineImage.fromSsmParameter(
    //   '/aws/service/canonical/ubuntu/server/focal/stable/current/amd64/hvm/ebs-gp2/ami-id'
    // );
    
    // set User Data
    // const userData = ec2.UserData.forLinux();
    // const userDataScript = fs.readFileSync(path.join(__dirname, 'userdata.sh'), 'utf8');
    // userData.addCommands(userDataScript);

    // ELB
    // const lb = new elb.LoadBalancer(this, `lb-for-${projectName}`, {
    //   vpc,
    //   internetFacing: true,      
    // });
    // lb.addListener({externalPort: 80});
    // lb.addListener({externalPort: 8501});

    

    const userData = ec2.UserData.forLinux({
      shebang: '#!/bin/bash',
    })
    userData.addCommands(
      'sudo yum install git python-pip -y',
      'pip install pip --upgrade',
      'pip install streamlit boto3',
      'git clone https://github.com/kyopark2014/llm-streamlit',
      'python3 -m venv venv',
      'source venv/bin/activate'
    )

    // vpc.availabilityZones


    // EC2 instance
    const appInstance = new ec2.Instance(this, `app-for-${projectName}`, {
      instanceName: `app-for-${projectName}`,
      instanceType: new ec2.InstanceType('t2.small'), // m5.large
      // instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.SMALL),
      
      // associatePublicIpAddress: true,
      // machineImage: ec2Image,
      // machineImage: ec2Image,
      
            
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023
      }),
      // machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      vpc: vpc,
      // vpcSubnets: vpc.selectSubnets({
      //   subnetType: ec2.SubnetType.PUBLIC,
      // }),
      vpcSubnets: {
        subnets: vpc.publicSubnets
      },
      securityGroup: ec2SecurityGroup,
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

    new cdk.CfnOutput(this, `instanceUrl-for-${projectName}`, {
      value: `http://${appInstance.instancePublicIp}/`,
      description: 'ec2InstanceUrl',
      exportName: 'ec2InstanceUrl',
    }); 

    // lb.addTarget(new elb.InstanceTarget(appInstance));
    // alb.addTarget(new elb.InstanceTarget(appInstance));

    const targets: elbv2_tg.InstanceTarget[] = new Array();
    targets.push(new elbv2_tg.InstanceTarget(appInstance));

    const listener = alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP
    })
    listener.addTargets('WebEc2Target', {
      targets,
      port: 80
    })
    
    new cdk.CfnOutput(this, `lbUrl-for-${projectName}`, {
      value: `http://${alb.loadBalancerDnsName}/`,
      description: 'lbUrl',
      exportName: 'lbUrl',
    }); 

    
  }
}
